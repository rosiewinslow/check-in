// services/account.ts
import { supabase } from "../lib/supabase";

export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
}

export async function saveNickname(nickname: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("로그인이 필요합니다.");
  const { error } = await supabase
    .from("profiles")
    .upsert({ id: user.id, nickname })
    .eq("id", user.id);
  if (error) throw error;
}

export async function linkGoogleOAuth() {
  const redirectTo = undefined; // 필요시 커스텀 스킴/리다이렉트 URL
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo },
  });
  if (error) throw error;
  // data.url로 브라우저가 열림(Expo에서는 자동)
  return data;
}

export async function signOutAll() {
  const { error } = await supabase.auth.signOut({ scope: "global" });
  if (error) throw error;
}

// 회원 탈퇴(Edge Function 호출)
export async function deleteMyAccount() {
  const { error } = await supabase.functions.invoke("delete-account", {
    body: {},   // 토큰은 자동 헤더로 전달됨
  });
  if (error) throw error;
}

export async function fetchProfile() {
  const user = await getCurrentUser();
  if (!user) return null;
  const { data, error } = await supabase
    .from("profiles")
    .select("nickname")
    .eq("id", user.id)
    .single();
  if (error && error.code !== "PGRST116") throw error; // not found 무시
  return data ?? null;
}
