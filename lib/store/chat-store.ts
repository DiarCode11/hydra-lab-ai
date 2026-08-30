import { create } from "zustand";
import { MessageModel } from "@/lib/db/type";

interface ChatStore {
  // State
  messages: MessageModel[];
  currentChatId: string | null;
  isLoading: boolean;
  isSending: boolean;

  // Actions
  setMessages: (messages: MessageModel[]) => void;
  addMessage: (message: MessageModel) => void;
  updateMessage: (id: string, content: string) => void;
  removeMessage: (id: string) => void;
  setCurrentChatId: (chatId: string | null) => void;
  setLoading: (loading: boolean) => void;
  setSending: (sending: boolean) => void;
  reset: () => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  // Initial state
  messages: [],
  currentChatId: null,
  isLoading: false,
  isSending: false,

  // Set semua messages sekaligus (biasanya dipanggil pas load history awal)
  setMessages: (messages) => set({ messages }),

  // Tambah 1 pesan baru (buat optimistic update pas kirim pesan)
  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),

  // Update isi pesan tertentu (misal buat streaming response AI)
  updateMessage: (id, content) =>
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === id ? { ...msg, content } : msg
      ),
    })),

  // Hapus pesan (misal kalau gagal kirim, rollback optimistic update)
  removeMessage: (id) =>
    set((state) => ({
      messages: state.messages.filter((msg) => msg.id !== id),
    })),

  setCurrentChatId: (chatId) => set({ currentChatId: chatId }),

  setLoading: (isLoading) => set({ isLoading }),

  setSending: (isSending) => set({ isSending }),

  // Reset semua state (misal pas ganti chat / logout)
  reset: () =>
    set({
      messages: [],
      currentChatId: null,
      isLoading: false,
      isSending: false,
    }),
}));