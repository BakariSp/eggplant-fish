import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

export async function getServerSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      get(name: string) {
        try {
          return cookieStore.get(name)?.value;
        } catch {
          return undefined;
        }
      },
      set(name: string, value: string, options?: Record<string, unknown>) {
        try {
          cookieStore.set({ name, value, ...(options ?? {}) });
        } catch {
          // ignore when not allowed
        }
      },
      remove(name: string, options?: Record<string, unknown>) {
        try {
          cookieStore.set({ name, value: "", ...(options ?? {}), maxAge: 0 });
        } catch {
          // ignore when not allowed
        }
      },
    },
  });
}

export function getAdminSupabaseClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }
  return createAdminClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}


