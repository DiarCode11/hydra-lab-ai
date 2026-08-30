"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { getMessage } from "@/lib/actions/chat";
import { MessageModel } from "@/lib/db/type";
import { ChatInput } from "@/components/chat-input";
import { ChatBubble } from "@/components/chat-bubble"; 
import { MessageSquare } from "lucide-react";

export default function ChatPage() {
  const params = useParams<{ id: string }>();
  const [chats, setChats] = useState<MessageModel[]>([]);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!params.id) return;

    const load = async () => {
      setLoading(true);
      const data = await getMessage(params.id);
      setChats(data);
      setLoading(false);
    };
    load();
  }, [params.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chats]);

  return (
    <main className="flex-1 w-full h-screen flex flex-col items-center bg-white dark:bg-black">
      <div className="flex-1 w-full max-w-2xl overflow-y-auto px-4 py-8 space-y-4">
        {chats.map((msg) => <ChatBubble key={msg.id} message={msg} />)}
        <div ref={bottomRef} />
      </div>

      <div className="w-full flex justify-center pb-6 px-4">
        <ChatInput />
      </div>
    </main>
  );
}