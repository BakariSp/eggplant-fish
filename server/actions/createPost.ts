"use server";

import { z } from "zod";
import { getServerSupabaseClient } from "@/lib/supabase";

const Input = z.object({
  petId: z.string().uuid(),
  content: z.string().min(1).max(2000),
  images: z.array(z.string().url()).max(3).optional(),
});

export async function createPost(raw: unknown) {
  const parsed = Input.safeParse(raw);
  if (!parsed.success) {
    return { ok: false as const, reason: "Invalid input" };
  }
  const { petId, content, images = [] } = parsed.data;
  const supabase = await getServerSupabaseClient();

  const { error } = await supabase.from("pet_posts").insert({
    pet_id: petId,
    content,
    images,
  });
  if (error) return { ok: false as const, reason: error.message };
  return { ok: true as const };
}


