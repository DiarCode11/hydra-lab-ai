import { NextResponse } from "next/server";
import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { chats, messages } from "@/lib/db/schema";
import { randomUUID } from "crypto";
import { imageUrlToDataUrl } from "@/lib/helpers/image-helper";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function toChatMessageParam(
  msg: { role: "user" | "assistant"; content: string; imageUrl: string | null }
): Promise<ChatCompletionMessageParam> {
  if (msg.role === "user" && msg.imageUrl) {
    const dataUrl = await imageUrlToDataUrl(msg.imageUrl);

    return {
      role: "user",
      content: [
        { type: "text", text: msg.content || "Tolong analisis gambar ini." },
        { type: "image_url", image_url: { url: dataUrl } },
      ],
    };
  }

  return { role: msg.role, content: msg.content };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const rawMessage = typeof body?.message === "string" ? body.message.trim() : "";
    const chatId = typeof body?.chatId === "string" && body.chatId.trim() ? body.chatId.trim() : null;
    const imageUrl = typeof body?.imageUrl === "string" && body.imageUrl.trim() ? body.imageUrl.trim() : null;

    if (!rawMessage && !imageUrl) {
      return NextResponse.json(
        { success: false, error: "Pesan tidak boleh kosong." },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { success: false, error: "OPENAI_API_KEY belum diatur." },
        { status: 500 }
      );
    }

    const finalChatId = chatId ?? crypto.randomUUID();

    const chatExists = chatId
      ? await db
          .select({ id: chats.id })
          .from(chats)
          .where(eq(chats.id, finalChatId))
          .limit(1)
      : [];

    if (!chatId || chatExists.length === 0) {
      await db.insert(chats).values({
        id: finalChatId,
        title: rawMessage.slice(0, 80) || "Gambar",
      });
    }

    await db.insert(messages).values({
      id: randomUUID(),
      chatId: finalChatId,
      role: "user",
      content: rawMessage,
      imageUrl,
    });

    const history = await db
      .select()
      .from(messages)
      .where(eq(messages.chatId, finalChatId))
      .orderBy(asc(messages.createdAt));

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.7,
      messages: [
        {
          role: "system",
          content:
            `Namamu adalah Hydra Lab AI, kamu adalah AI yang bertugas memberi informasi hanya dilingkup bidang sains pendidikan, 
            jika user bertanya diluar topik itu tolong jawab bahwa kamu hanya bisa memberikan informasi terkait sains saja,
            Kamu dilarang:
            memberikan kode program dan yang diluar kaitan dengan sains pendidikan,
            jika user mengirim gambar dan tidak ada kaitannya dengan sains pnedidikan kamu wajib menjawab tidak tahu
            `,
        },
        ...(await Promise.all(history.map(toChatMessageParam))),
      ],
    });

    const assistantReply =
      completion.choices[0]?.message?.content?.trim() ||
      "Maaf, saya tidak bisa membalas saat ini.";

    await db.insert(messages).values({
      id: randomUUID(),
      chatId: finalChatId,
      role: "assistant",
      content: assistantReply,
    });

    return NextResponse.json({
      success: true,
      chatId: finalChatId,
      userMessage: rawMessage,
      userImageUrl: imageUrl,
      assistantMessage: assistantReply,
    });
  } catch (error) {
    console.error("Chat API error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Terjadi kesalahan pada server.",
      },
      { status: 500 }
    );
  }
}
