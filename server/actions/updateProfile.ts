"use server";

import { z } from "zod";
import { getServerSupabaseClient } from "@/lib/supabase";

const Input = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(80).optional(),
  breed: z.string().max(120).optional(),
  birthdate: z
    .string()
    .optional()
    .refine((s) => s === undefined || !Number.isNaN(Date.parse(s)), "Invalid date"),
  avatar_url: z.string().url().optional(),
  vaccinated: z.boolean().optional(),
  allergy_note: z.string().max(500).optional(),
});

export async function updateProfile(raw: unknown) {
  const parsed = Input.safeParse(raw);
  if (!parsed.success) return { ok: false as const, reason: "Invalid input" };
  const { id, ...updates } = parsed.data;
  const supabase = getServerSupabaseClient();
  const { error } = await supabase.from("pets").update(updates).eq("id", id);
  if (error) return { ok: false as const, reason: error.message };
  return { ok: true as const };
}


