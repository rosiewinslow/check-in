import { AUTH_ENABLED } from "../config/appConfig";
import { supabase } from "../lib/supabase";

export async function signInEmailPassword(email: string, password: string) {
  if (!AUTH_ENABLED) return { session: null, user: null }; // ✅ 무시
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signUpEmailPassword(email: string, password: string) {
  if (!AUTH_ENABLED) return { session: null, user: null };
  return supabase.auth.signUp({ email, password });
}

export async function signOutAll() {
  if (!AUTH_ENABLED) return;
  await supabase.auth.signOut({ scope: "global" });
}

export async function getCurrentUser() {
  if (!AUTH_ENABLED) return null;
  const { data: { user } } = await supabase.auth.getUser();
  return user ?? null;
}
