// services/todos.ts
import { supabase } from "../lib/supabase";
import { getUserId } from "./auth";
import type { Todo, ISODate } from "../types";

const now = () => Date.now();

/** 날짜별 조회 */
export async function fetchTodosByDate(date: ISODate): Promise<Todo[]> {
  const { data, error } = await supabase
    .from("todos")
    .select("*")
    .eq("date", date)
    .order("progress", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as unknown as Todo[];
}

/** 추가 */
export async function addTodo(params: { title: string; date: ISODate; note?: string }) {
  const user_id = await getUserId();
  const row = {
    user_id,
    title: params.title,
    date: params.date,   // DB는 date 타입, RN에서는 "YYYY-MM-DD" 문자열이면 자동 캐스팅됨
    progress: 0,
    note: params.note ?? null,
    created_at: now(),
    updated_at: null,
    due_at: null,
    notify_at: null,
    notification_id: null,
    completed_at: null,
  };

  const { data, error } = await supabase.from("todos").insert(row).select().single();
  if (error) throw error;
  return data as unknown as Todo;
}

/** 진행률(완료 토글 포함) */
export async function setProgress(id: string, progress: number) {
  const patch: Partial<Todo> = {
    progress,
    updatedAt: now(),
    // Supabase 컬럼명은 snake_case였지 → DB 쪽 키로 보냄
  } as any;

  const dbPatch: any = {
    progress,
    updated_at: now(),
    completed_at: progress >= 100 ? now() : null,
  };

  const { error } = await supabase.from("todos").update(dbPatch).eq("id", id);
  if (error) throw error;
}

/** 수정 (노트, 마감일 등) */
export async function updateTodo(id: string, patch: Partial<Omit<Todo, "id">>) {
  const dbPatch: any = { updated_at: now() };

  if (patch.title !== undefined) dbPatch.title = patch.title;
  if (patch.note !== undefined) dbPatch.note = patch.note;
  if (patch.dueAt !== undefined) dbPatch.due_at = patch.dueAt;
  if (patch.notifyAt !== undefined) dbPatch.notify_at = patch.notifyAt;
  if (patch.notificationId !== undefined) dbPatch.notification_id = patch.notificationId;
  if (patch.date !== undefined) dbPatch.date = patch.date; // 날짜 변경도 가능

  if (patch.progress !== undefined) {
    dbPatch.progress = patch.progress;
    dbPatch.completed_at = patch.progress >= 100 ? now() : null;
  }

  const { error } = await supabase.from("todos").update(dbPatch).eq("id", id);
  if (error) throw error;
}

/** 삭제 */
export async function removeTodo(id: string) {
  const { error } = await supabase.from("todos").delete().eq("id", id);
  if (error) throw error;
}

/** 이월 (미완료만 from → to로 복제) */
export async function rolloverTodos(fromDate: ISODate, toDate: ISODate) {
  const { data, error } = await supabase.rpc("rollover_todos", {
    from_date: fromDate,
    to_date: toDate,
  });
  if (error) throw error;
  return (data as number) ?? 0;
}
