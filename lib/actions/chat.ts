"use server"

import { redirect } from "next/navigation"
import { db } from "../db"
import { chats, messages } from "../db/schema"
import { randomUUID } from "crypto"
import { desc, eq } from "drizzle-orm"

export async function createChat(message: string) {
    const chatId = crypto.randomUUID()

    await db.insert(chats).values({
        id: chatId,
        title: message
    })

    await db.insert(messages).values({
        id: randomUUID(),
        chatId,
        role: "user",
        content: message,
    });

    redirect(`/chat/${chatId}`)
}

export async function getMessage(chatId: string) {
    return await db
        .select()
        .from(messages)
        .where(eq(messages.chatId, chatId))
}

export async function getUserChats(userId: string | null) {
  return await db
    .select()
    .from(chats)
    // .where(eq(chats.userId, userId))
    .orderBy(desc(chats.createdAt));
}

export async function deleteAllChats(userId: string) {
  await db.delete(chats).where(eq(chats.userId, userId));
}

export async function deleteChat(chatId: string) {
  await db.delete(chats).where(eq(chats.id, chatId));
}