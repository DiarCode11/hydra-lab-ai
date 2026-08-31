"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { getMessage } from "@/lib/actions/chat";
import { MessageModel } from "@/lib/db/type";
import { ChatInput } from "@/components/chat-input";
import { ChatBubble } from "@/components/chat-bubble";
import { Bot, LoaderCircle } from "lucide-react";

export default function ChatPage() {
  const params = useParams<{ id: string }>();
  const [chats, setChats] = useState<MessageModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [isThinking, setIsThinking] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const appendMessage = (message: Partial<MessageModel> & { role: "user" | "assistant"; content: string; chatId: string }) => {
    setChats((prev) => {
      const nextMessage = {
        id: message.id ?? crypto.randomUUID(),
        role: message.role,
        content: message.content,
        chatId: message.chatId,
        imageUrl: message.imageUrl ?? null,
        createdAt: message.createdAt ?? new Date(),
      } as MessageModel;

      const alreadyExists = prev.some((item) => item.id === nextMessage.id);

      if (alreadyExists) {
        return prev;
      }

      return [...prev, nextMessage];
    });
  };

  useEffect(() => {
    if (!params.id) return;

    const load = async () => {
      setLoading(true);

      const data = await getMessage(params.id);
      const pendingKey = `pending-chat-${params.id}`;
      const pendingRaw = sessionStorage.getItem(pendingKey);
      const pendingMessages = pendingRaw ? JSON.parse(pendingRaw) : [];

      const mergedChats = [...data];

      pendingMessages.forEach((message: Partial<MessageModel> & { role: "user" | "assistant"; content: string; chatId: string; imageUrl?: string | null; createdAt?: string }) => {
        const alreadyExists = mergedChats.some(
          (item) => item.chatId === message.chatId && item.content === message.content && item.role === message.role
        );

        if (!alreadyExists) {
          mergedChats.push({
            id: message.id ?? crypto.randomUUID(),
            chatId: message.chatId,
            role: message.role,
            content: message.content,
            imageUrl: message.imageUrl ?? null,
            createdAt: message.createdAt ? new Date(message.createdAt) : new Date(),
          } as MessageModel);
        }
      });

      setChats(
        mergedChats.sort(
          (a, b) =>
            new Date(a.createdAt ?? 0).getTime() - new Date(b.createdAt ?? 0).getTime()
        )
      );
      sessionStorage.removeItem(pendingKey);
      setLoading(false);
    };
    load();
  }, [params.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chats, isThinking]);

  return (
    <main className="flex h-full w-full flex-col items-center bg-white dark:bg-black">
      <div className="flex-1 w-full max-w-2xl overflow-y-auto px-4 py-8 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-6 text-sm text-neutral-500">
            Memuat chat...
          </div>
        ) : (
          chats.map((msg) => <ChatBubble key={msg.id} message={msg} />)
        )}

        {isThinking && (
          <div className="flex items-start gap-3 w-full justify-start animate-[fadeIn_0.3s_ease-out]">
            <div className="shrink-0 h-8 w-8 rounded-full bg-neutral-900 dark:bg-white flex items-center justify-center">
              <Bot className="h-4 w-4 text-white dark:text-black" />
            </div>

            <div className="max-w-[75%] rounded-2xl rounded-bl-sm bg-neutral-100 px-4 py-3 text-sm text-neutral-900 dark:bg-neutral-900 dark:text-neutral-100 shadow-sm">
              <div className="flex items-center gap-2">
                <LoaderCircle className="h-4 w-4 animate-spin" />
                <span>Hydra Lab AI sedang menulis...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <div className="w-full flex justify-center pb-6 px-4 shrink-0">
        <ChatInput
          chatId={params.id}
          onThinkingChange={setIsThinking}
          onAppendUserMessage={(content, chatId, imageUrl) =>
            appendMessage({
              id: `temp-user-${Date.now()}`,
              role: "user",
              content,
              chatId,
              imageUrl: imageUrl ?? null,
              createdAt: new Date(),
            })
          }
          onAppendAssistantMessage={(content, chatId) =>
            appendMessage({
              id: `temp-assistant-${Date.now()}`,
              role: "assistant",
              content,
              chatId,
              createdAt: new Date(),
            })
          }
        />
      </div>
    </main>
  );
}