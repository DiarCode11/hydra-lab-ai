"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { MessageSquarePlus, PanelLeft, Trash2, MessageSquare } from "lucide-react";
import { useChatListStore } from "@/lib/store/chat-list-store";
import { getUserChats, deleteAllChats } from "@/lib/actions/chat";
import LoginComponent from "@/components/login-component";
import RegisterComponent from "@/components/register-component";
import { GetSessionAction, LogoutAction } from "@/lib/actions/get-auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface HomeLayoutInterface {
  children: React.ReactNode;
}

function ChatHistoryLink({ chatId, title }: { chatId: string; title?: string | null }) {
  const pathname = usePathname();
  const isActive = pathname === `/chat/${chatId}`;

  return (
    <Link
      key={chatId}
      href={`/chat/${chatId}`}
      className={`${isActive ? "bg-neutral-900 text-white dark:bg-neutral-800" : "text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-900"} flex items-center gap-2 text-sm rounded-lg px-3 py-2 truncate`}
    >
      <MessageSquare className="h-4 w-4 shrink-0" />
      <span className="truncate">{title || "Percakapan baru"}</span>
    </Link>
  );
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
    router.push("/");
  };

  const handleDeleteAll = async () => {
    await deleteAllChats(CURRENT_USER_ID);
    clearChatList();
    setAuthData(false);
    router.push("/");
  };

  const handleLogout = async () => {
    try {
      await LogoutAction();
      clearChatList();
      setAuthData(false);
      
      // Give a moment for state updates to process
      await new Promise(resolve => setTimeout(resolve, 100));
      
      router.push("/");
      router.refresh();
      
      // Hard reload to clear all client state
      setTimeout(() => {
        window.location.href = "/";
      }, 500);
    } catch (error) {
      console.error("Logout error:", error);
    }
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
    <div className="flex h-screen overflow-hidden">
      <aside className="w-[300px] flex flex-col border-r border-neutral-200 dark:border-neutral-800 bg-white dark:bg-black">
        <div className="flex justify-between items-center p-5 pb-0">
          <h1 className="text-lg font-semibold">Hydra Lab AI</h1>
          <PanelLeft className="cursor-pointer" />
        </div>

        <div className="flex flex-col gap-2 my-4 px-5">
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

        <div className="pt-5 flex-1 overflow-y-auto px-5 pb-5">
          <h4 className="text-sm font-semibold text-neutral-300">History Chat</h4>

          {isLoadingList ? (
            <p className="text-sm text-neutral-400 mt-2">Memuat...</p>
          ) : chatList.length === 0 ? (
            <p className="text-sm text-neutral-400 mt-2">
              Percakapan Anda akan muncul di sini setelah Anda mulai mengobrol!
            </p>
          ) : (
            <div className="mt-2 flex flex-col gap-1">
              {chatList.map((chat) => (
                <ChatHistoryLink key={chat.id} chatId={chat.id} title={chat.title} />
              ))}
            </div>
          )}
        </div>
      </aside>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <nav className="shrink-0 flex justify-end gap-x-2 bg-neutral-900/10 py-2 px-4">
          {authData ? (
            <DropdownMenu>
              <DropdownMenuTrigger 
                nativeButton={false}
                render={
                  <Avatar className="cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    <AvatarImage src={authData.avatar_url} />
                    <AvatarFallback>{getInitials(authData.name)}</AvatarFallback>
                  </Avatar>
              } />
              <DropdownMenuContent className="w-50" align="end">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>
                    <div>
                      <span>{authData.name}</span>
                      <p>{authData.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className={"text-red-400 hover:text-red-500 hover:bg-red-300 cursor-pointer"}
                    onClick={async (event) => {
                      event.preventDefault();
                      await handleLogout();
                    }}
                  >
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

        <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
      </div>
    </div>
  );
}