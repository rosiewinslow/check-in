// services/todoService.ts
import { supabase } from "../lib/supabase";

export type SBTodo = {
  id: string;
  user_id: string;
  title: string;
  done: boolean;
  created_at: number;      // 클라가 number timestamp 사용
  updated_at?: string | null;
};

export async function pullTodos(): Promise<SBTodo[]> {
  const { data, error } = await supabase
    .from("todos")
    .select("*")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return data as SBTodo[];
}

export async function insertTodos(rows: Omit<SBTodo, "user_id">[]) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const payload = rows.map(r => ({ ...r, user_id: user.id }));
  const { error } = await supabase.from("todos").insert(payload);
  if (error) throw error;
}

export async function updateTodo(id: string, patch: Partial<SBTodo>) {
  const { error } = await supabase.from("todos").update(patch).eq("id", id);
  if (error) throw error;
}

export async function deleteTodo(id: string) {
  const { error } = await supabase.from("todos").delete().eq("id", id);
  if (error) throw error;
}
