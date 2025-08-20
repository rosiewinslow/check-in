// store/useTodoStore.ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { nanoid } from "nanoid/non-secure";
import * as Notifications from "expo-notifications";

// ★ 추가: 원격 동기화 모듈
import { remotePull, remoteUpsert, remoteDelete, StoreTodo as RemoteStoreTodo } from "../services/todoRemote";

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
  rolloverTo: (dateKey: string) => void;
  isReadOnly: (item: StoreTodo) => boolean;

  // ★ 동기화 API (추가)
  hydrateFromServer: () => Promise<void>;
  syncUp: () => Promise<void>;
  syncDown: () => Promise<void>;
  syncAll: () => Promise<void>;
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

// ★ 내부 outbox/삭제큐(메모리 전용: persist 안 함)
const outbox = new Set<string>();
const trash = new Set<string>();
const markDirty = (id?: string) => { if (id) outbox.add(id); };
const markDeleted = (id?: string) => { if (id) { trash.add(id); outbox.delete(id); } };

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
          originId: id,
          title: title.trim(),
          done: false,
          createdAt: now,
          updatedAt: now,
          progress: 0,
          date: todayKey(),
        };
        set({ todos: [...get().todos, item] });
        markDirty(id);               // ★ 동기화 표시
      },

      addForDate: (dateKey, title) => {
        const now = Date.now();
        const id = nanoid();
        const item: StoreTodo = {
          id,
          originId: id,
          title: title.trim(),
          done: false,
          createdAt: now,
          updatedAt: now,
          progress: 0,
          date: dateKey || todayKey(),
        };
        set({ todos: [...get().todos, item] });
        markDirty(id);               // ★
      },

      // === 삭제 ===
      remove: (id) => {
        const target = get().todos.find(t => t.id === id);
        if (target?.notificationId) cancelScheduled(target.notificationId);
        set({ todos: get().todos.filter(t => t.id !== id) });
        markDeleted(id);             // ★ 서버에서도 삭제
      },

      // === 제목 변경 (해당 스냅샷만) ===
      rename: (id, title) => {
        const now = Date.now();
        set({
          todos: get().todos.map(t => t.id === id ? { ...t, title: title.trim(), updatedAt: now } : t),
        });
        markDirty(id);               // ★
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
        markDirty(id);               // ★
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
        markDirty(id);               // ★
      },

      // === 스냅샷 이월 ===
      rolloverTo: (dateK) => {
        const list = get().todos;
        const byOrigin = new Map<string, StoreTodo[]>();
        for (const t of list) {
          if (!byOrigin.has(t.originId)) byOrigin.set(t.originId, []);
          byOrigin.get(t.originId)!.push(t);
        }

        const existToday = new Set(list.filter(t => t.date === dateK).map(t => t.originId));
        const newOnes: StoreTodo[] = [];

        for (const [originId, arr] of byOrigin) {
          arr.sort((a,b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : b.createdAt - a.createdAt));
          const latestBefore = arr.find(t => t.date < dateK);
          if (!latestBefore) continue;

          if (latestBefore.progress < 100 && !existToday.has(originId)) {
            const now = Date.now();
            const id = nanoid();
            newOnes.push({
              id,
              originId,
              title: latestBefore.title,
              done: false,
              createdAt: now,
              updatedAt: now,
              progress: latestBefore.progress,
              date: dateK,
            });
            markDirty(id);           // ★ 새 스냅샷도 서버 업서트
          }
        }

        if (newOnes.length) set({ todos: [...list, ...newOnes] });
      },

      // === 읽기 전용 판별 ===
      isReadOnly: (item) => item.date < todayKey(), // 🔒 과거일자면 잠금

      // ── ★ 동기화 API ────────────────────────────────────────────
      hydrateFromServer: async () => {
        // 서버 → 로컬 (LWW: updatedAt 기준 최신값 유지)
        const serverRows = await remotePull(); // StoreTodo[]
        const local = get().todos;
        const map = new Map<string, StoreTodo>();
        for (const t of local) map.set(t.id, t);
        for (const srv of serverRows) {
          const cur = map.get(srv.id);
          const curUpdated = cur?.updatedAt ?? 0;
          const srvUpdated = srv.updatedAt ?? 0;
          if (!cur || srvUpdated > curUpdated) {
            map.set(srv.id, srv);
          }
        }
        set({ todos: Array.from(map.values()) });
      },

      syncUp: async () => {
        // 삭제 먼저
        const delIds = Array.from(trash.values());
        if (delIds.length) {
          await remoteDelete(delIds);
          trash.clear();
        }
        // outbox 업서트
        const ids = Array.from(outbox.values());
        if (!ids.length) return;
        const payload = get().todos.filter(t => ids.includes(t.id));
        if (payload.length) {
          await remoteUpsert(payload as RemoteStoreTodo[]);
        }
        outbox.clear();
      },

      syncDown: async () => {
        await get().hydrateFromServer();
      },

      syncAll: async () => {
        await get().syncUp();
        await get().syncDown();
      },
    }),
    {
      name: "todo-store-v4",
      storage: createJSONStorage(() => AsyncStorage),
      version: 4,
      migrate: (state: any, version) => {
        if (!state?.state?.todos) return state;
        const now = Date.now();
        if (version < 4) {
          state.state.todos = state.state.todos.map((t: any) => ({
            originId: t.originId ?? t.id,
            date: t.date ?? toKstDateKey(new Date(t.createdAt || now)),
            ...t,
          }));
        }
        return state;
      },
      partialize: (s) => ({ todos: s.todos }), // outbox/trash는 저장 안 함
    }
  )
);
