import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { ChatMessage } from "@/api/types";

interface ChatState {
  conversations: Record<string, ChatMessage[]>; // key: "partnerId" or "userId1-userId2"
  activeConversation: string | null;
  loading: boolean;
}

const initialState: ChatState = {
  conversations: {},
  activeConversation: null,
  loading: false,
};

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    setActiveConversation: (state, action: PayloadAction<string>) => {
      state.activeConversation = action.payload;
    },
    setConversationMessages: (
      state,
      action: PayloadAction<{ conversationId: string; messages: ChatMessage[] }>
    ) => {
      const { conversationId, messages } = action.payload;
      state.conversations[conversationId] = messages;
    },
    addMessage: (
      state,
      action: PayloadAction<{ conversationId: string; message: ChatMessage }>
    ) => {
      const { conversationId, message } = action.payload;
      if (!state.conversations[conversationId]) {
        state.conversations[conversationId] = [];
      }
      state.conversations[conversationId].push(message);
    },
    updateMessage: (
      state,
      action: PayloadAction<{
        conversationId: string;
        messageId: number;
        updates: Partial<ChatMessage>;
      }>
    ) => {
      const { conversationId, messageId, updates } = action.payload;
      const conversation = state.conversations[conversationId];
      if (conversation) {
        const messageIndex = conversation.findIndex(
          (msg) => msg.id === messageId
        );
        if (messageIndex !== -1) {
          state.conversations[conversationId][messageIndex] = {
            ...conversation[messageIndex],
            ...updates,
          };
        }
      }
    },
    removeMessage: (
      state,
      action: PayloadAction<{ conversationId: string; messageId: number }>
    ) => {
      const { conversationId, messageId } = action.payload;
      const conversation = state.conversations[conversationId];
      if (conversation) {
        state.conversations[conversationId] = conversation.filter(
          (msg) => msg.id !== messageId
        );
      }
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    clearConversation: (state, action: PayloadAction<string>) => {
      delete state.conversations[action.payload];
    },
  },
});

export const {
  setActiveConversation,
  setConversationMessages,
  addMessage,
  updateMessage,
  removeMessage,
  setLoading,
  clearConversation,
} = chatSlice.actions;

// Selectors
export const selectConversations = (state: { chat: ChatState }) =>
  state.chat.conversations;
export const selectActiveConversation = (state: { chat: ChatState }) =>
  state.chat.activeConversation;
export const selectConversationMessages =
  (conversationId: string) => (state: { chat: ChatState }) =>
    state.chat.conversations[conversationId] || [];
export const selectChatLoading = (state: { chat: ChatState }) =>
  state.chat.loading;

export default chatSlice.reducer;
