import { MessageModel } from "@/lib/db/type";
import { cn } from "@/lib/utils";
import { Bot, CheckCheck, User } from "lucide-react";
import ReactMarkdown from "react-markdown";
import Image from "next/image";

interface ChatBubbleProps {
  message: MessageModel;
}

export function ChatBubble({ message }: ChatBubbleProps) {
  const isUser = message.role === "user";
  const isAssistant = message.role === "assistant";

  return (
    <div
      className={cn(
        "flex items-start gap-3 w-full",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      {!isUser && (
        <div className="shrink-0 h-8 w-8 rounded-full bg-neutral-900 dark:bg-white flex items-center justify-center">
          <Bot className="h-4 w-4 text-white dark:text-black" />
        </div>
      )}

      <div className="flex max-w-[75%] flex-col gap-1">
        <div
          className={cn(
            "rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm transition-all duration-500 ease-out animate-[fadeIn_0.35s_ease-out]",
            isUser
              ? "bg-black text-white dark:bg-white dark:text-black rounded-br-sm"
              : "bg-neutral-100 text-neutral-900 dark:bg-neutral-900 dark:text-neutral-100 rounded-bl-sm"
          )}
        >
          {message.imageUrl && (
            <div className="relative mb-2 h-48 w-48 overflow-hidden rounded-xl">
              <Image
                src={message.imageUrl}
                alt="Gambar terlampir"
                fill
                className="object-cover"
              />
            </div>
          )}

          {isAssistant ? (
            <div className="prose dark:prose-invert prose-sm max-w-none">
              <ReactMarkdown>
                {message.content}
              </ReactMarkdown>
            </div>
          ) : message.content ? (
            <p className="whitespace-pre-wrap break-words">{message.content}</p>
          ) : null}
        </div>

        {isAssistant && (
          <div className="flex items-center justify-end gap-1 text-[10px] text-neutral-400 animate-[slideUp_0.4s_ease-out]">
            <CheckCheck className="h-3 w-3" />
            <span>jawaban selesai</span>
          </div>
        )}
      </div>

      {isUser && (
        <div className="shrink-0 h-8 w-8 rounded-full bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center">
          <User className="h-4 w-4 text-neutral-600 dark:text-neutral-300" />
        </div>
      )}
    </div>
  );
}