import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type Habit = {
  id: string;
  name: string;
  color: string;      // 표시 색
  createdAt: number;
};

type State = {
  habits: Habit[];
  // key = `${habitId}:${yyyy}-${mm}-${dd}` → true/false
  checks: Record<string, boolean>;
  addHabit: (name: string) => void;
  removeHabit: (id: string) => void;
  renameHabit: (id: string, name: string) => void;
  toggleCheck: (habitId: string, dateKey: string) => void;
  clearWeek: (startISO: string, endISO: string) => void;
};

const dateKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;

const palette = [
  "#A3E635", "#60A5FA", "#F472B6", "#F59E0B",
  "#34D399", "#C084FC", "#F87171", "#22D3EE",
];

const rid = () => `${Date.now()}-${Math.random().toString(36).slice(2,8)}`;

export const useHabitStore = create<State>()(
  persist(
    (set, get) => ({
      habits: [],
      checks: {},
      addHabit: (name) =>
        set((s) => ({
          habits: [
            ...s.habits,
            {
              id: rid(),
              name: name.trim() || "새 습관",
              color: palette[s.habits.length % palette.length],
              createdAt: Date.now(),
            },
          ],
        })),
      removeHabit: (id) =>
        set((s) => {
          const nextChecks: Record<string, boolean> = {};
          // 해당 habit의 체크들은 제거
          for (const k of Object.keys(s.checks)) {
            if (!k.startsWith(id + ":")) nextChecks[k] = s.checks[k];
          }
          return {
            habits: s.habits.filter((h) => h.id !== id),
            checks: nextChecks,
          };
        }),
      renameHabit: (id, name) =>
        set((s) => ({
          habits: s.habits.map((h) =>
            h.id === id ? { ...h, name: name.trim() || h.name } : h
          ),
        })),
      toggleCheck: (habitId, dk) =>
        set((s) => {
          const key = `${habitId}:${dk}`;
          const cur = !!s.checks[key];
          return { checks: { ...s.checks, [key]: !cur } };
        }),
      clearWeek: (startISO, endISO) =>
        set((s) => {
          // startISO/endISO는 yyyy-mm-dd 형태
          const toDate = (iso: string) => {
            const [y, m, d] = iso.split("-").map((v) => Number(v));
            return new Date(y, m - 1, d);
          };
          const start = toDate(startISO);
          const end = toDate(endISO);
          const inRange = (iso: string) => {
            const [y, m, d] = iso.split("-").map((v) => Number(v));
            const cur = new Date(y, m - 1, d);
            return start <= cur && cur <= end;
          };

          const nextChecks: Record<string, boolean> = {};
          for (const k of Object.keys(s.checks)) {
            const [, day] = k.split(":");
            if (!inRange(day)) nextChecks[k] = s.checks[k];
          }
          return { checks: nextChecks };
        }),
    }),
    {
      name: "habit-store-v1",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ habits: s.habits, checks: s.checks }),
    }
  )
);

// 유틸: 주(월요일 시작) 7일 생성 & ISO 키
export const mondayOf = (anchor: Date) => {
  const d = new Date(anchor);
  const dow = (d.getDay() + 6) % 7; // Mon=0, ... Sun=6
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - dow);
  return d;
};

export const weekDays = (anchor: Date) => {
  const mon = mondayOf(anchor);
  return Array.from({ length: 7 }, (_, i) => {
    const x = new Date(mon);
    x.setDate(mon.getDate() + i);
    return x;
  });
};

export const toISO = (d: Date) => dateKey(d);
