import type { User } from "@supabase/supabase-js";
import { getServerSupabaseClient } from "./supabase";

export async function getCurrentUser(): Promise<User | null> {
  const supabase = await getServerSupabaseClient();
  const { data, error } = await supabase.auth.getUser();
  if (error) return null;
  return data.user ?? null;
}

export async function getSession() {
  const supabase = await getServerSupabaseClient();
  const { data } = await supabase.auth.getSession();
  return data.session ?? null;
}


