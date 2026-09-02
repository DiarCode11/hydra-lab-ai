"use server"

import { db } from "../db"
import { chats, messages } from "../db/schema"
import { randomUUID } from "crypto"
import { and, asc, desc, eq, inArray } from "drizzle-orm"
import OpenAI from "openai"
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions"
import { imageUrlToDataUrl } from "../helpers/image-helper"
import { getSessionUserId } from "./get-auth"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

async function toChatMessageParam(msg: {
  role: "user" | "assistant"
  content: string
  imageUrl: string | null
}): Promise<ChatCompletionMessageParam> {
  if (msg.role === "user" && msg.imageUrl) {
    const dataUrl = await imageUrlToDataUrl(msg.imageUrl)

    return {
      role: "user",
      content: [
        { type: "text", text: msg.content || "Tolong analisis gambar ini." },
        { type: "image_url", image_url: { url: dataUrl } },
      ],
    }
  }

  return { role: msg.role, content: msg.content }
}

async function generateAssistantReply(chatId: string) {
  const conversation = await db
    .select()
    .from(messages)
    .where(eq(messages.chatId, chatId))
    .orderBy(asc(messages.createdAt))

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.7,
    messages: [
      {
        role: "system",
        content:
          "Kamu adalah asisten AI yang membantu user di aplikasi chat. Jawab singkat, jelas, dan relevan.",
      },
      ...(await Promise.all(conversation.map(toChatMessageParam))),
    ],
  })

  return (
    completion.choices[0]?.message?.content?.trim() ||
    "Maaf, saya tidak bisa menjawab saat ini."
  )
}

async function persistUserAndAssistantMessage(
  chatId: string,
  content: string,
  imageUrl?: string | null
) {
  const cleanContent = content.trim()

  if (!cleanContent && !imageUrl) return null

  await db.insert(messages).values({
    id: randomUUID(),
    chatId,
    role: "user",
    content: cleanContent,
    imageUrl: imageUrl ?? null,
  })

  const assistantReply = await generateAssistantReply(chatId)

  await db.insert(messages).values({
    id: randomUUID(),
    chatId,
    role: "assistant",
    content: assistantReply,
  })

  return assistantReply
}

export async function createChat(message: string, imageUrl?: string | null) {
  const cleanMessage = message.trim()

  if (!cleanMessage && !imageUrl) {
    return null
  }

  const userId = await getSessionUserId()
  if (!userId) return null

  const chatId = crypto.randomUUID()

  await db.insert(chats).values({
    id: chatId,
    userId,
    title: cleanMessage.slice(0, 80) || "Gambar",
  })

  await persistUserAndAssistantMessage(chatId, cleanMessage, imageUrl)

  return chatId
}

export async function sendMessageToChat(
  chatId: string,
  message: string,
  imageUrl?: string | null
) {
  const cleanMessage = message.trim()

  if (!cleanMessage && !imageUrl) {
    return null
  }

  const userId = await getSessionUserId()
  if (!userId) return null

  const ownedChat = await db
    .select({ id: chats.id })
    .from(chats)
    .where(and(eq(chats.id, chatId), eq(chats.userId, userId)))
    .limit(1)

  if (ownedChat.length === 0) return null

  return await persistUserAndAssistantMessage(chatId, cleanMessage, imageUrl)
}

export async function getMessage(chatId: string) {
  const userId = await getSessionUserId()
  if (!userId) return []

  const ownedChat = await db
    .select({ id: chats.id })
    .from(chats)
    .where(and(eq(chats.id, chatId), eq(chats.userId, userId)))
    .limit(1)

  if (ownedChat.length === 0) return []

  return await db
    .select()
    .from(messages)
    .where(eq(messages.chatId, chatId))
    .orderBy(asc(messages.createdAt))
}

export async function getUserChats() {
  const userId = await getSessionUserId()
  if (!userId) return []

  return await db
    .select()
    .from(chats)
    .where(eq(chats.userId, userId))
    .orderBy(desc(chats.createdAt));
}

export async function deleteAllChats() {
  const userId = await getSessionUserId()
  if (!userId) return;

  const userChats = await db
    .select({ id: chats.id })
    .from(chats)
    .where(eq(chats.userId, userId));

  if (userChats.length === 0) return;

  await db.delete(messages).where(inArray(messages.chatId, userChats.map((chat) => chat.id)));
  await db.delete(chats).where(eq(chats.userId, userId));
}

export async function deleteChat(chatId: string) {
  await db.delete(messages).where(eq(messages.chatId, chatId));
  await db.delete(chats).where(eq(chats.id, chatId));
}