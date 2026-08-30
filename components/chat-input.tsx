"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SendHorizonal, Paperclip, Plus } from "lucide-react";
import { createChat } from "@/lib/actions/chat";

export function ChatInput() {
  const [message, setMessage] = useState("");
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
    if (!message.trim()) return;
    await createChat(message)
    setMessage("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "40px";
    }
  };

  return (
    <div className="w-full max-w-2xl">
      <div className="flex flex-col gap-2 rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 p-3 shadow-sm focus-within:ring-1 focus-within:ring-neutral-400">
        {/* Row atas: textarea full width */}
        <Textarea
          ref={textareaRef}
          value={message}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder="Kirim pesan ke Hydra Lab AI..."
          rows={1}
          className="resize-none border-0 bg-transparent shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 overflow-y-auto px-1 leading-relaxed"
          style={{ height: "40px", maxHeight: "200px" }}
        />

        {/* Row bawah: tombol-tombol */}
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
            disabled={!message.trim()}
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