import { MessageModel } from "@/lib/db/type";
import { cn } from "@/lib/utils";
import { Bot, User } from "lucide-react";

interface ChatBubbleProps {
  message: MessageModel;
}

export function ChatBubble({ message }: ChatBubbleProps) {
  const isUser = message.role === "user";

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

      <div
        className={cn(
          "max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm",
          isUser
            ? "bg-black text-white dark:bg-white dark:text-black rounded-br-sm"
            : "bg-neutral-100 text-neutral-900 dark:bg-neutral-900 dark:text-neutral-100 rounded-bl-sm"
        )}
      >
        <p className="whitespace-pre-wrap break-words">{message.content}</p>
      </div>

      {isUser && (
        <div className="shrink-0 h-8 w-8 rounded-full bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center">
          <User className="h-4 w-4 text-neutral-600 dark:text-neutral-300" />
        </div>
      )}
    </div>
  );
}