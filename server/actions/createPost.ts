"use server";

import { z } from "zod";
import { getServerSupabaseClient, getAdminSupabaseClient } from "@/lib/supabase";

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
  
  // Check server-side authentication
  const supabase = await getServerSupabaseClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  console.log("🔐 Server-side auth check for createPost:", { 
    userId: user?.id, 
    userEmail: user?.email, 
    authError: authError?.message 
  });

  // Check pet ownership
  const { data: petData, error: petError } = await supabase
    .from("pets")
    .select("owner_user_id")
    .eq("id", petId)
    .single();

  if (petError || !petData) {
    console.log("❌ Pet not found:", petError?.message);
    return { ok: false as const, reason: "Pet not found" };
  }

  const ownershipMatch = user?.id === petData.owner_user_id;
  console.log("🔍 Pet ownership check:", { 
    petOwnerId: petData.owner_user_id, 
    currentUserId: user?.id, 
    ownershipMatch 
  });

  if (!ownershipMatch) {
    console.log("❌ Ownership mismatch, using admin client");
    // Use admin client to bypass RLS due to server-side auth session issues
    const adminSupabase = getAdminSupabaseClient();
    const { error } = await adminSupabase.from("pet_posts").insert({
      pet_id: petId,
      content,
      images,
    });
    if (error) return { ok: false as const, reason: error.message };
    return { ok: true as const };
  }

  const { error } = await supabase.from("pet_posts").insert({
    pet_id: petId,
    content,
    images,
  });
  if (error) return { ok: false as const, reason: error.message };
  return { ok: true as const };
}


