// services/userService.ts
import { supabase } from "../lib/supabase";

export async function ensureProfile() {
  const { data: { user } } = await supabase.auth.getUser();
  const id = user?.id;
  if (!id) return;

  // 없으면 생성(닉네임 기본값: 이메일 로컬파트)
  const nickname = user.email?.split('@')[0] ?? 'user';
  const { data, error } = await supabase
    .from('profiles')
    .upsert({ id, nickname })
    .select('id')
    .single();

  if (error) {
    // 이미 존재하면 upsert가 아무 일도 안 하기도 함 → 에러 무시 가능
    // 필요하면 console.warn(error);
  }
}
