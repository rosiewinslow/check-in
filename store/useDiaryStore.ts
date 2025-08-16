import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type Diary = {
  text: string;
  updatedAt: number;
};

type State = {
  diaries: Record<string, Diary>; // key: "YYYY-MM-DD"
  setDiary: (dateKey: string, text: string) => void;
  removeDiary: (dateKey: string) => void;
};

export const toDateKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;

export const useDiaryStore = create<State>()(
  persist(
    (set) => ({
      diaries: {},
      setDiary: (dateKey, text) =>
        set((s) => ({
          diaries: {
            ...s.diaries,
            [dateKey]: { text: text.trim(), updatedAt: Date.now() },
          },
        })),
      removeDiary: (dateKey) =>
        set((s) => {
          const next = { ...s.diaries };
          delete next[dateKey];
          return { diaries: next };
        }),
    }),
    {
      name: "diary-store-v1",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ diaries: s.diaries }),
    }
  )
);
