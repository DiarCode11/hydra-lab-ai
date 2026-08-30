import { create } from "zustand";
import { ChatModel } from "@/lib/db/type";

interface ChatListStore {
  // State
  chatList: ChatModel[];
  isLoadingList: boolean;

  // Actions
  setChatList: (chats: ChatModel[]) => void;
  addChatToList: (chat: ChatModel) => void;
  updateChatTitle: (chatId: string, title: string) => void;
  removeChatFromList: (chatId: string) => void;
  setLoadingList: (loading: boolean) => void;
  clearChatList: () => void;
}

export const useChatListStore = create<ChatListStore>((set) => ({
  // Initial state
  chatList: [],
  isLoadingList: false,

  // Set semua chat sekaligus (dipanggil pas load awal dari database)
  setChatList: (chats) => set({ chatList: chats }),

  // Tambah 1 chat baru ke paling atas list (chat terbaru muncul duluan)
  addChatToList: (chat) =>
    set((state) => ({ chatList: [chat, ...state.chatList] })),

  // Update judul chat tertentu (misal auto-generate title dari pesan pertama)
  updateChatTitle: (chatId, title) =>
    set((state) => ({
      chatList: state.chatList.map((chat) =>
        chat.id === chatId ? { ...chat, title } : chat
      ),
    })),

  // Hapus 1 chat dari list (misal delete individual chat)
  removeChatFromList: (chatId) =>
    set((state) => ({
      chatList: state.chatList.filter((chat) => chat.id !== chatId),
    })),

  setLoadingList: (isLoadingList) => set({ isLoadingList }),

  // Kosongkan semua (dipanggil pas "Hapus History")
  clearChatList: () => set({ chatList: [] }),
}));