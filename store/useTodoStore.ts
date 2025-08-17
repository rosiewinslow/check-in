// store/useTodoStore.ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { nanoid } from "nanoid/non-secure";
import * as Notifications from "expo-notifications";

// 🆕 YYYY-MM-DD (Asia/Seoul)
const toKstDateKey = (d = new Date()) => {
  const kst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
  return kst.toISOString().slice(0, 10);
};
const todayKey = () => toKstDateKey(new Date());

// 🆕 확장 타입: originId로 “같은 작업” 묶기, date는 스냅샷 일자
export type StoreTodo = {
  id: string;
  originId: string;      // 🆕 동일 작업 묶음 키 (최초 생성 시 자기 id)
  title: string;
  done: boolean;
  createdAt: number;
  progress: number;
  date: string;          // YYYY-MM-DD (해당 일자의 스냅샷)
  note?: string;
  dueAt?: number;
  notifyAt?: number;
  notificationId?: string;
  updatedAt?: number;
  completedAt?: number;
};

type State = {
  todos: StoreTodo[];
  // 기존 API
  add: (title: string) => void;
  addForDate: (dateKey: string, title: string) => void;
  remove: (id: string) => void;
  rename: (id: string, title: string) => void;
  setProgress: (id: string, p: number) => void;
  setDetail: (id: string, detail: { note?: string; dueAt?: number | null; notifyAt?: number | null }) => Promise<void>;

  // 🆕 스냅샷 이월 (어제 미완료 → 오늘 복제 생성)
  rolloverTo: (dateKey: string) => void;

  // 🆕 읽기 전용 여부 (과거일자)
  isReadOnly: (item: StoreTodo) => boolean;
};

// --- 알림 유틸 (동일) ---
async function ensureNotiPermission() {
  const { status } = await Notifications.getPermissionsAsync();
  if (status !== "granted") {
    const req = await Notifications.requestPermissionsAsync();
    return req.status === "granted";
  }
  return true;
}
async function scheduleAt(dateMs: number, payload: { todoId: string; title: string }) {
  const ok = await ensureNotiPermission();
  if (!ok) return null;
  let fire = new Date(dateMs);
  if (fire.getTime() < Date.now() + 3000) fire = new Date(Date.now() + 3000);
  const id = await Notifications.scheduleNotificationAsync({
    content: { title: "알림", body: payload.title, data: payload },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: fire,
      channelId: "default",
    },
  });
  return id;
}
async function cancelScheduled(id?: string) {
  if (!id) return;
  try { await Notifications.cancelScheduledNotificationAsync(id); } catch {}
}

export const useTodoStore = create<State>()(
  persist(
    (set, get) => ({
      todos: [],

      // === 생성 ===
      add: (title) => {
        const now = Date.now();
        const id = nanoid();
        const item: StoreTodo = {
          id,
          originId: id,            // 🆕 최초 생성 → 자기 자신이 originId
          title: title.trim(),
          done: false,
          createdAt: now,
          updatedAt: now,
          progress: 0,
          date: todayKey(),
        };
        set({ todos: [...get().todos, item] });
      },

      addForDate: (dateKey, title) => {
        const now = Date.now();
        const id = nanoid();
        const item: StoreTodo = {
          id,
          originId: id,            // 🆕 최초 생성 → 자기 자신이 originId
          title: title.trim(),
          done: false,
          createdAt: now,
          updatedAt: now,
          progress: 0,
          date: dateKey || todayKey(),
        };
        set({ todos: [...get().todos, item] });
      },

      // === 삭제 ===
      remove: (id) => {
        const target = get().todos.find(t => t.id === id);
        if (target?.notificationId) cancelScheduled(target.notificationId);
        set({ todos: get().todos.filter(t => t.id !== id) });
      },

      // === 제목 변경 (해당 스냅샷만) ===
      rename: (id, title) => {
        const now = Date.now();
        set({
          todos: get().todos.map(t => t.id === id ? { ...t, title: title.trim(), updatedAt: now } : t),
        });
      },

      // === 진행률 ===
      setProgress: (id, p) => {
        const now = Date.now();
        set({
          todos: get().todos.map(t => {
            if (t.id !== id) return t;
            const next = Math.max(0, Math.min(100, Math.round(p)));
            const becameDone = next === 100;
            const nextObj: StoreTodo = {
              ...t,
              progress: next,
              done: becameDone,
              updatedAt: now,
              completedAt: becameDone ? now : undefined,
            };
            if (becameDone && t.notificationId) {
              cancelScheduled(t.notificationId);
              nextObj.notificationId = undefined;
            }
            return nextObj;
          }),
        });
      },

      // === 디테일 저장 ===
      setDetail: async (id, detail) => {
        const list = get().todos;
        const target = list.find(t => t.id === id);
        if (!target) return;

        let notificationId = target.notificationId;
        if (detail.notifyAt !== undefined) {
          if (detail.notifyAt === null) {
            if (notificationId) await cancelScheduled(notificationId);
            notificationId = undefined;
          } else {
            if (target.done) {
              if (notificationId) await cancelScheduled(notificationId);
              notificationId = undefined;
            } else {
              if (notificationId) await cancelScheduled(notificationId);
              const newId = await scheduleAt(detail.notifyAt as number, { todoId: target.id, title: target.title });
              notificationId = newId ?? undefined;
            }
          }
        }
        const now = Date.now();
        const patched: StoreTodo = {
          ...target,
          note: detail.note !== undefined ? (detail.note?.trim() || undefined) : target.note,
          dueAt: detail.dueAt === null ? undefined : (detail.dueAt ?? target.dueAt),
          notifyAt: detail.notifyAt === null ? undefined : (detail.notifyAt ?? target.notifyAt),
          notificationId,
          updatedAt: now,
        };
        set({ todos: list.map(t => (t.id === id ? patched : t)) });
      },

      // === 스냅샷 이월 ===
      rolloverTo: (dateK) => {
        const list = get().todos;
        // originId별로 “오늘 이전의 가장 최신 스냅샷”을 찾아서 미완료면 오늘 사본 생성
        const byOrigin = new Map<string, StoreTodo[]>();
        for (const t of list) {
          if (!byOrigin.has(t.originId)) byOrigin.set(t.originId, []);
          byOrigin.get(t.originId)!.push(t);
        }

        const existToday = new Set(list.filter(t => t.date === dateK).map(t => t.originId));
        const newOnes: StoreTodo[] = [];

        for (const [originId, arr] of byOrigin) {
          // 최신순 정렬
          arr.sort((a,b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : b.createdAt - a.createdAt));
          const latestBefore = arr.find(t => t.date < dateK); // date 문자열 비교로 KST 일자 비교
          if (!latestBefore) continue;

          if (latestBefore.progress < 100 && !existToday.has(originId)) {
            const now = Date.now();
            newOnes.push({
              id: nanoid(),
              originId,
              title: latestBefore.title,     // 제목/속성은 이어받음
              done: false,                   // 새날은 미완료로 시작
              createdAt: now,
              updatedAt: now,
              progress: latestBefore.progress, // ⬅️ 전일 진행률 이어받기
              date: dateK,
              // note/due/notify는 새날엔 비우는 걸 기본값으로 둠 (일별 메모/마감 분리)
              // 필요한 경우 latestBefore.note 등을 복사해도 됨
            });
          }
        }

        if (newOnes.length) set({ todos: [...list, ...newOnes] });
      },

      // === 읽기 전용 판별 ===
      isReadOnly: (item) => item.date < todayKey(), // 🔒 과거일자면 잠금
    }),
    {
      name: "todo-store-v4",          // 🆕 버전업
      storage: createJSONStorage(() => AsyncStorage),
      version: 4,
      migrate: (state: any, version) => {
        if (!state?.state?.todos) return state;
        const now = Date.now();
        // v3 → v4: originId 채우기, date 보정
        if (version < 4) {
          state.state.todos = state.state.todos.map((t: any) => ({
            originId: t.originId ?? t.id,                 // 🆕
            date: t.date ?? toKstDateKey(new Date(t.createdAt || now)),
            ...t,
          }));
        }
        return state;
      },
      partialize: (s) => ({ todos: s.todos }),
    }
  )
);
