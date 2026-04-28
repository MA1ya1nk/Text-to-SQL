"use client";

import { create } from "zustand";
import { QueryResponse } from "@/lib/types";

type ConversationEntry = { question: string; response?: QueryResponse; error?: string };

type AssistantState = {
  conversation: ConversationEntry[];
  schema: Record<string, unknown> | null;
  history: Array<Record<string, unknown>>;
  loading: boolean;
  setLoading: (value: boolean) => void;
  addConversation: (item: ConversationEntry) => void;
  setSchema: (schema: Record<string, unknown>) => void;
  setHistory: (history: Array<Record<string, unknown>>) => void;
};

export const useAssistantStore = create<AssistantState>((set) => ({
  conversation: [],
  schema: null,
  history: [],
  loading: false,
  setLoading: (value) => set({ loading: value }),
  addConversation: (item) => set((state) => ({ conversation: [item, ...state.conversation] })),
  setSchema: (schema) => set({ schema }),
  setHistory: (history) => set({ history })
}));
