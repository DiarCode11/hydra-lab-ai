import { ChatInput } from "@/components/chat-input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquarePlus, PanelLeft, Paperclip, SendHorizonal, Trash2 } from "lucide-react";
import Image from "next/image";

export default function Home() {
  return (
      <main className="flex-1 w-full flex flex-col items-center justify-between py-8 px-16 bg-white dark:bg-black">
        {/* Area pesan (kosong dulu, nanti diisi chat) */}
        <div className="flex-1 w-full flex flex-col items-center gap-5 justify-center">
          <h1 className="text-5xl font-bold">Hydra Lab AI</h1>
          <p className="text-neutral-400 text-sm">
            Mulai percakapan dengan mengetik pesan di bawah
          </p>
        </div>

        {/* Chat Input */}
        <ChatInput />
      </main>
  );
}
