"use client";

import { useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SendHorizonal, Plus, X, LoaderCircle } from "lucide-react";
import Image from "next/image";

interface ChatInputProps {
  chatId?: string | null;
  onThinkingChange?: (thinking: boolean) => void;
  onAppendUserMessage?: (content: string, chatId: string, imageUrl?: string | null) => void;
  onAppendAssistantMessage?: (content: string, chatId: string) => void;
  onCreateNewChat?: (message: string, imageUrl?: string | null) => Promise<void> | void;
}

const ALLOWED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

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
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";

    if (!file) return;

    setUploadError(null);

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setUploadError("Tipe file tidak didukung. Gunakan PNG, JPG, WEBP, atau GIF.");
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      setUploadError("Ukuran file maksimal 5MB.");
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Gagal mengunggah gambar.");
      }

      setImageUrl(data.url);
    } catch (error) {
      console.error("Upload image error:", error);
      setUploadError(error instanceof Error ? error.message : "Gagal mengunggah gambar.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setImageUrl(null);
    setUploadError(null);
  };

  const handleSend = async () => {
    const nextMessage = message.trim();
    const nextImageUrl = imageUrl;

    if ((!nextMessage && !nextImageUrl) || isSending || isUploading) return;

    setIsSending(true);
    onThinkingChange?.(true);

    try {
      let targetChatId = activeChatId;

      if (!targetChatId) {
        await onCreateNewChat?.(nextMessage, nextImageUrl);
        setMessage("");
        setImageUrl(null);
        if (textareaRef.current) {
          textareaRef.current.style.height = "40px";
        }
        return;
      }

      if (targetChatId && onAppendUserMessage) {
        onAppendUserMessage(nextMessage, targetChatId, nextImageUrl);
      }

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: nextMessage,
          chatId: targetChatId,
          imageUrl: nextImageUrl,
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
      setImageUrl(null);
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
        {(imageUrl || isUploading) && (
          <div className="relative inline-block w-20 h-20 rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800">
            {isUploading ? (
              <div className="flex h-full w-full items-center justify-center">
                <LoaderCircle className="h-5 w-5 animate-spin text-neutral-400" />
              </div>
            ) : imageUrl ? (
              <>
                <Image src={imageUrl} alt="Gambar terlampir" fill className="object-cover" />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute top-1 right-1 rounded-full bg-black/60 text-white p-0.5 hover:bg-black/80"
                  aria-label="Hapus gambar"
                >
                  <X className="h-3 w-3" />
                </button>
              </>
            ) : null}
          </div>
        )}

        {uploadError && (
          <p className="text-xs text-red-500 px-1">{uploadError}</p>
        )}

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
          <input
            ref={fileInputRef}
            type="file"
            accept={ALLOWED_IMAGE_TYPES.join(",")}
            className="hidden"
            onChange={handleFileSelect}
          />
          <Button
            variant="ghost"
            size="icon"
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isSending || isUploading}
            className="shrink-0 rounded-full text-neutral-500 border border-neutral-200 dark:border-neutral-700"
          >
            <Plus className="h-5 w-5" />
          </Button>

          <Button
            size="icon"
            onClick={handleSend}
            disabled={(!message.trim() && !imageUrl) || isSending || isUploading}
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