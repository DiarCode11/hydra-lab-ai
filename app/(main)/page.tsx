"use client";

import { useRouter } from "next/navigation";
import { ChatInput } from "@/components/chat-input";

export default function Home() {
  const router = useRouter();

  return (
    <main className="h-full w-full flex flex-col items-center justify-between px-4 md:py-8 md:px-16 bg-white dark:bg-black">
      <div className="flex-1 w-full flex flex-col items-center gap-5 justify-center">
        <h1 className="text-5xl font-bold text-center">Hydra Lab AI</h1>
        <p className="text-neutral-400 text-sm text-center">
          Mulai percakapan dengan mengetik pesan di bawah
        </p>
      </div>

      <ChatInput
        onCreateNewChat={async (message, imageUrl) => {
          const newChatId = crypto.randomUUID();

          const response = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              message,
              chatId: newChatId,
              imageUrl,
            }),
          });

          const data = await response.json();

          if (!response.ok || !data.success) {
            throw new Error(data.error || "Gagal membuat chat baru.");
          }

          const pendingMessages = [
            {
              id: `pending-user-${newChatId}`,
              chatId: newChatId,
              role: "user",
              content: message,
              imageUrl: imageUrl ?? null,
              createdAt: new Date().toISOString(),
            },
            {
              id: `pending-assistant-${newChatId}`,
              chatId: newChatId,
              role: "assistant",
              content: data.assistantMessage,
              createdAt: new Date(Date.now() + 1000).toISOString(),
            },
          ];

          sessionStorage.setItem(
            `pending-chat-${newChatId}`,
            JSON.stringify(pendingMessages)
          );

          router.push(`/chat/${newChatId}`);
        }}
      />
    </main>
  );
}
