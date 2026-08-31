"use client";

import { useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SendHorizonal, Plus } from "lucide-react";

interface ChatInputProps {
  chatId?: string | null;
  onThinkingChange?: (thinking: boolean) => void;
  onAppendUserMessage?: (content: string, chatId: string) => void;
  onAppendAssistantMessage?: (content: string, chatId: string) => void;
  onCreateNewChat?: (message: string) => Promise<void> | void;
}

export function ChatInput({
  chatId,
  onThinkingChange,
  onAppendUserMessage,
  onAppendAssistantMessage,
  onCreateNewChat,
}: ChatInputProps) {
  const router = useRouter();
  const params = useParams<{ id?: string }>();
  const activeChatId = chatId ?? params?.id ?? null;
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);

    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = "auto";
    textarea.style.height = Math.min(textarea.scrollHeight, 200) + "px";
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = async () => {
    const nextMessage = message.trim();

    if (!nextMessage || isSending) return;

    setIsSending(true);
    onThinkingChange?.(true);

    try {
      let targetChatId = activeChatId;

      if (!targetChatId) {
        await onCreateNewChat?.(nextMessage);
        setMessage("");
        if (textareaRef.current) {
          textareaRef.current.style.height = "40px";
        }
        return;
      }

      if (targetChatId && onAppendUserMessage) {
        onAppendUserMessage(nextMessage, targetChatId);
      }

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: nextMessage,
          chatId: targetChatId,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Gagal mengirim pesan.");
      }

      if (data.assistantMessage && targetChatId && onAppendAssistantMessage) {
        onAppendAssistantMessage(data.assistantMessage, targetChatId);
      }

      setMessage("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "40px";
      }
    } catch (error) {
      console.error("Send chat error:", error);
    } finally {
      setIsSending(false);
      onThinkingChange?.(false);
    }
  };

  return (
    <div className="w-full max-w-2xl">
      <div className="flex flex-col gap-2 rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 p-3 shadow-sm focus-within:ring-1 focus-within:ring-neutral-400">
        <Textarea
          ref={textareaRef}
          value={message}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder="Kirim pesan ke Hydra Lab AI..."
          rows={1}
          disabled={isSending}
          autoFocus
          className="resize-none border-0 bg-transparent shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 overflow-y-auto px-1 leading-relaxed disabled:cursor-not-allowed"
          style={{ height: "40px", maxHeight: "200px" }}
        />

        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 rounded-full text-neutral-500 border border-neutral-200 dark:border-neutral-700"
          >
            <Plus className="h-5 w-5" />
          </Button>

          <Button
            size="icon"
            onClick={handleSend}
            disabled={!message.trim() || isSending}
            className="shrink-0 rounded-full bg-black text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200 disabled:opacity-40"
          >
            <SendHorizonal className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <p className="text-xs text-center text-neutral-400 mt-2">
        Hydra Lab AI dapat membuat kesalahan. Periksa info penting.
      </p>
    </div>
  );
}