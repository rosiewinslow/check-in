import { supabase } from "../lib/supabase";

export async function signUp(email: string, password: string) {
  // 개발 중엔 이메일 확인 꺼놨으니 바로 로그인됨
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return data.user;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data.user;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser() {
  const { data } = await supabase.auth.getUser();
  return data.user; // null이면 비로그인
}

/** CRUD에서 user_id 넣어야 하니 이 헬퍼 씀 */
export async function getUserId(): Promise<string> {
  const { data } = await supabase.auth.getUser();
  const id = data.user?.id;
  if (!id) throw new Error("Not signed in");
  return id;
}