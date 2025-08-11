"use server";

import { z } from "zod";
import { getAdminSupabaseClient } from "@/lib/supabase";

const Input = z.object({
  slug: z.string().min(1),
  editKey: z.string().min(6),
});

export type VerifyEditKeyResult =
  | { ok: true; petId: string }
  | { ok: false; reason: string };

export async function verifyEditKey(raw: unknown): Promise<VerifyEditKeyResult> {
  const parsed = Input.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, reason: "Invalid input" };
  }
  const { slug, editKey } = parsed.data;
  const supabase = getAdminSupabaseClient();

  // 1) Look up pet by slug
  const { data: pet, error: petErr } = await supabase
    .from("pets")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  if (petErr || !pet) return { ok: false, reason: "Pet not found" };

  // 2) Check edit_keys for valid, not used, not expired
  const { data: keyRow, error: keyErr } = await supabase
    .from("edit_keys")
    .select("id, is_used, expires_at")
    .eq("pet_id", pet.id)
    .limit(1)
    .maybeSingle();
  if (keyErr || !keyRow) return { ok: false, reason: "No key found" };

  // In real implementation, compare hash. Placeholder only.
  if (keyRow.is_used) return { ok: false, reason: "Key already used" };
  if (keyRow.expires_at && new Date(keyRow.expires_at) < new Date()) {
    return { ok: false, reason: "Key expired" };
  }

  // TODO: hash comparison when key hash stored; omitted for scaffold
  if (!editKey) return { ok: false, reason: "Invalid key" };

  return { ok: true, petId: pet.id };
}


