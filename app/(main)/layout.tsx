"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { MessageSquarePlus, PanelLeft, Trash2, MessageSquare } from "lucide-react";
import { useChatListStore } from "@/lib/store/chat-list-store";
import { getUserChats, deleteAllChats } from "@/lib/actions/chat";
import LoginComponent from "@/components/login-component";
import RegisterComponent from "@/components/register-component";
import { GetSessionAction } from "@/lib/actions/get-auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface HomeLayoutInterface {
  children: React.ReactNode;
}

// Sementara hardcode dulu sebelum ada auth beneran
const CURRENT_USER_ID = null;

interface SessionInterface {
  id: string,
  name: string,
  email: string,
  avatar_url: string
}

export default function HomeLayout({ children }: HomeLayoutInterface) {
  const router = useRouter();
  const params = useParams<{ id: string }>()

  const chatList = useChatListStore((state) => state.chatList);
  const isLoadingList = useChatListStore((state) => state.isLoadingList);
  const setChatList = useChatListStore((state) => state.setChatList);
  const clearChatList = useChatListStore((state) => state.clearChatList);
  const setLoadingList = useChatListStore((state) => state.setLoadingList);

  const [authData, setAuthData] = useState<SessionInterface | null | false>(null)

  useEffect(() => {
    const auth = async () => {
      const data = await GetSessionAction()
      if (data['user'] == null) {
        setAuthData(false);
      } else {
        setAuthData(data['user'] as SessionInterface)
      }
    }
    const load = async () => {
      setLoadingList(true);
      const data = await getUserChats(CURRENT_USER_ID);
      setChatList(data);
      setLoadingList(false);
    };

    load();
    auth()
  }, []);

  const handleNewChat = () => {
    router.push("/"); // atau route buat mulai chat baru
  };

  const handleDeleteAll = async () => {
    await deleteAllChats(CURRENT_USER_ID);
    clearChatList();
    router.push("/");
  };

  function getInitials(name: string) {
    const parts = name.trim().split(" ").filter(Boolean)

    if (parts.length > 1) {
      // ada spasi → huruf awal dari 2 kata pertama
      return (parts[0][0] + parts[1][0]).toUpperCase()
    }

    // tanpa spasi → 2 huruf pertama dari kata itu
    return name.slice(0, 2).toUpperCase()
  }

  return (
    <div className="flex h-screen">
      <aside className="w-[300px] p-5 flex flex-col border-r border-neutral-200 dark:border-neutral-800">
        <div className="flex justify-between items-center">
          <h1 className="text-lg font-semibold">Hydra Lab AI</h1>
          <PanelLeft className="cursor-pointer" />
        </div>

        {/* Button */}
        <div className="flex flex-col gap-2 my-4">
          <Button
            variant={"outline"}
            className="py-3 px-4 flex justify-start gap-x-2"
            onClick={handleNewChat}
          >
            <MessageSquarePlus />
            Chat Baru
          </Button>
          <Button
            variant={"outline"}
            className="py-3 px-4 flex justify-start gap-x-2 text-red-400"
            onClick={handleDeleteAll}
            disabled={chatList.length === 0}
          >
            <Trash2 />
            Hapus History
          </Button>
        </div>

        {/* History */}
        <div className="pt-5 flex-1 overflow-y-auto">
          <h4 className="text-sm font-semibold text-neutral-300">History Chat</h4>

          {isLoadingList ? (
            <p className="text-sm text-neutral-400 mt-2">Memuat...</p>
          ) : chatList.length === 0 ? (
            <p className="text-sm text-neutral-400 mt-2">
              Percakapan Anda akan muncul di sini setelah Anda mulai mengobrol!
            </p>
          ) : (
            <div className="flex flex-col gap-1 mt-2">
              {chatList.map((chat) => (
                <Link
                  key={chat.id}
                  href={`/chat/${chat.id}`}
                  className={`${chat.id == params.id ? 'bg-neutral-900' : ''} flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-900 rounded-lg px-3 py-2 truncate`}
                >
                  <MessageSquare className="h-4 w-4 shrink-0" />
                  <span className="truncate">{chat.title || "Percakapan baru"}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </aside>

        <div className="flex-1 flex flex-col">
            <nav className="flex justify-end gap-x-2 bg-neutral-900/10 py-2 px-4">
              { authData ? (
                <DropdownMenu>
                  <DropdownMenuTrigger render={
                    <button type="button">
                      <Avatar>
                        <AvatarImage src={authData.avatar_url} />
                        <AvatarFallback>{getInitials(authData.name)}</AvatarFallback>
                      </Avatar>
                    </button>
                  } />
                  <DropdownMenuContent className="w-50" align="start">
                    <DropdownMenuGroup>
                      <DropdownMenuLabel>
                        <div>
                          <span>{authData.name}</span>
                          <p>{authData.email}</p>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className={"text-red-400 hover:text-red-500 hover:bg-red-300"}>
                        Log out
                        <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
                      </DropdownMenuItem>
                    </DropdownMenuGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <>
                  <LoginComponent />
                  <RegisterComponent />
                </>
              )}
            </nav>
            {children}
        </div>
    </div>
  );
}