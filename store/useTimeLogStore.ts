import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type TimeLog = {
  id: string;
  dateKey: string;      // YYYY-MM-DD
  start: string;        // "HH:mm"
  end?: string | null;  // "HH:mm" | null
  memo: string;
  createdAt: number;
};

type State = {
  logs: TimeLog[];
  add: (dateKey: string) => void;
  setStart: (id: string, hhmm: string) => void;
  setEnd:   (id: string, hhmm: string | null) => void;
  setMemo:  (id: string, memo: string) => void;
  remove:   (id: string) => void;
};

const rid = () => `${Date.now()}-${Math.random().toString(36).slice(2,8)}`;

export const toDateKey = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const nowToNearest30 = () => {
  const d = new Date();
  d.setSeconds(0, 0);
  const m = d.getMinutes();
  d.setMinutes(m < 15 ? 0 : m < 45 ? 30 : 0);
  if (m >= 45) d.setHours(d.getHours() + 1);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
};

export const useTimeLogStore = create<State>()(
  persist(
    (set, get) => ({
      logs: [],
      add: (dateKey) =>
        set({
          logs: [
            ...get().logs,
            {
              id: rid(),
              dateKey,
              start: nowToNearest30(),
              end: null,
              memo: "",
              createdAt: Date.now(),
            },
          ],
        }),
      setStart: (id, hhmm) =>
        set({ logs: get().logs.map(l => (l.id === id ? { ...l, start: hhmm } : l)) }),
      setEnd: (id, hhmm) =>
        set({ logs: get().logs.map(l => (l.id === id ? { ...l, end: hhmm } : l)) }),
      setMemo: (id, memo) =>
        set({ logs: get().logs.map(l => (l.id === id ? { ...l, memo } : l)) }),
      remove: (id) => set({ logs: get().logs.filter(l => l.id !== id) }),
    }),
    {
      name: "timelog-store-v1",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ logs: s.logs }),
    }
  )
);
