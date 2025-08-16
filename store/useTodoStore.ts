import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
// nanoid/non-secure 또는 uuid 중 하나 선택해서 이미 쓰고 있던 걸 유지하세요.
import { nanoid } from "nanoid/non-secure";

export type Todo = {
  id: string;
  title: string;
  done: boolean;
  createdAt: number;
  progress: number; // 0~100
};

type State = {
  todos: Todo[];
  add: (title: string) => void;
  toggle: (id: string) => void;
  remove: (id: string) => void;
  rename: (id: string, title: string) => void;
  clearDone: () => void;
  setProgress: (id: string, p: number) => void;
};

export const useTodoStore = create<State>()(
  persist(
    (set, get) => ({
      todos: [],
      add: (title) =>
        set({
          todos: [
            ...get().todos,
            {
              id: nanoid(),
              title: title.trim(),
              done: false,
              createdAt: Date.now(),
              progress: 0,
            },
          ],
        }),
      toggle: (id) =>
        set({
          todos: get().todos.map((t) =>
            t.id === id ? { ...t, done: !t.done, progress: !t.done ? 100 : 0 } : t
          ),
        }),
      remove: (id) => set({ todos: get().todos.filter((t) => t.id !== id) }),
      rename: (id, title) =>
        set({
          todos: get().todos.map((t) =>
            t.id === id ? { ...t, title: title.trim() } : t
          ),
        }),
      clearDone: () => set({ todos: get().todos.filter((t) => !t.done) }),
      setProgress: (id, p) =>
        set({
          todos: get().todos.map((t) => {
            if (t.id !== id) return t;
            const next = Math.max(0, Math.min(100, Math.round(p)));
            // 100% 되면 자동 완료, 100% 미만이면 진행중(완료 해제)
            return next === 100
              ? { ...t, progress: 100, done: true }
              : { ...t, progress: next, done: false };
          }),
        }),
    }),
    {
      name: "todo-store-v2",
      storage: createJSONStorage(() => AsyncStorage),
      version: 2,
      // 기존 데이터 마이그레이션: progress 없으면 0으로 채움
      migrate: (state: any, version) => {
        if (!state?.state?.todos) return state;
        if (version < 2) {
          state.state.todos = state.state.todos.map((t: any) => ({
            progress: 0,
            ...t,
          }));
        }
        return state;
      },
      partialize: (s) => ({ todos: s.todos }),
    }
  )
);
