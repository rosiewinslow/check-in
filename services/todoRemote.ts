// services/todoRemote.ts
import { supabase } from "../lib/supabase";

// 서버 테이블 기준 타입 (DB 스키마는 아래 주석 참고)
export type RemoteTodo = {
  id: string;
  user_id: string;
  origin_id: string;
  title: string;
  done: boolean;
  created_at: number;     // bigint (ms)
  updated_at: string | null; // timestamptz
  progress: number;
  date: string;           // YYYY-MM-DD
  note?: string | null;
  due_at?: number | null;
  notify_at?: number | null;
  notification_id?: string | null;
  completed_at?: number | null;
};

// 로컬 StoreTodo ↔ 서버 RemoteTodo 매핑
export type StoreTodo = {
  id: string;
  originId: string;
  title: string;
  done: boolean;
  createdAt: number;
  progress: number;
  date: string;
  note?: string;
  dueAt?: number;
  notifyAt?: number;
  notificationId?: string;
  updatedAt?: number;
  completedAt?: number;
};

export function toRemote(row: StoreTodo, userId: string): Omit<RemoteTodo, "updated_at" | "user_id"> & { user_id: string } {
  return {
    id: row.id,
    user_id: userId,
    origin_id: row.originId,
    title: row.title,
    done: row.done,
    created_at: row.createdAt,
    progress: row.progress,
    date: row.date,
    note: row.note ?? null,
    due_at: row.dueAt ?? null,
    notify_at: row.notifyAt ?? null,
    notification_id: row.notificationId ?? null,
    completed_at: row.completedAt ?? null,
  };
}
export function toStore(row: RemoteTodo): StoreTodo {
  return {
    id: row.id,
    originId: row.origin_id,
    title: row.title,
    done: row.done,
    createdAt: row.created_at,
    progress: row.progress,
    date: row.date,
    note: row.note ?? undefined,
    dueAt: row.due_at ?? undefined,
    notifyAt: row.notify_at ?? undefined,
    notificationId: row.notification_id ?? undefined,
    updatedAt: row.updated_at ? new Date(row.updated_at).getTime() : undefined,
    completedAt: row.completed_at ?? undefined,
  };
}

// ── API ───────────────────────────────────────────────────────────
export async function remotePull(): Promise<StoreTodo[]> {
  const { data, error } = await supabase
    .from("todos")
    .select("*")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data as RemoteTodo[]).map(toStore);
}

export async function remoteUpsert(rows: StoreTodo[]): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const payload = rows.map(r => toRemote(r, user.id));
  const { error } = await supabase.from("todos").upsert(payload, { onConflict: "id" });
  if (error) throw error;
}

export async function remoteDelete(ids: string[]): Promise<void> {
  if (!ids.length) return;
  const { error } = await supabase.from("todos").delete().in("id", ids);
  if (error) throw error;
}

