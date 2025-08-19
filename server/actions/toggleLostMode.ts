"use server";

import { z } from "zod";
import { getServerSupabaseClient } from "@/lib/supabase";

const Input = z.object({
  petId: z.string().uuid(),
  lostMode: z.boolean(),
  lostMessage: z.string().max(300).optional(),
});

export async function toggleLostMode(raw: unknown) {
  const parsed = Input.safeParse(raw);
  if (!parsed.success) return { ok: false as const, reason: "Invalid input" };
  const { petId, lostMode, lostMessage } = parsed.data;
  const supabase = await getServerSupabaseClient();
  const updates: Record<string, unknown> = { lost_mode: lostMode };
  if (lostMode) {
    updates["lost_since"] = new Date().toISOString();
    if (lostMessage !== undefined) updates["lost_message"] = lostMessage;
  } else {
    updates["lost_since"] = null;
    updates["lost_message"] = lostMessage ?? null;
  }
  const { error } = await supabase.from("pets").update(updates).eq("id", petId);
  if (error) return { ok: false as const, reason: error.message };
  return { ok: true as const };
}


