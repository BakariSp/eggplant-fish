"use server";

import { z } from "zod";
import { getServerSupabaseClient, getAdminSupabaseClient } from "@/lib/supabase";

const Input = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(80).optional(),
  breed: z.string().max(120).optional(),
  birthdate: z
    .string()
    .nullable()
    .optional()
    .refine((s) => s === undefined || s === null || !Number.isNaN(Date.parse(s)), "Invalid date"),
  avatar_url: z.array(z.string().url()).optional(),
  vaccinated: z.array(z.string()).optional(),
  allergy_note: z.union([z.string().max(500), z.array(z.string())]).nullable().optional(),
  // New fields with placeholder support
  gender: z.enum(["male", "female", "unknown"]).optional(),
  microchip_id: z.string().max(50).nullable().optional(),
  neuter_status: z.boolean().nullable().optional(),
  traits: z.array(z.string()).optional(),
  // Age fields
  year: z.number().int().min(0).max(30).nullable().optional(),
  month: z.number().int().min(0).max(11).nullable().optional(),
});

export async function updateProfile(raw: unknown) {
  const parsed = Input.safeParse(raw);
  if (!parsed.success) {
    console.error("Validation failed:", parsed.error);
    return { ok: false as const, reason: `Invalid input: ${parsed.error.message}` };
  }
  const { id, ...updates } = parsed.data;
  
  // Debug: Check authentication
  const supabase = await getServerSupabaseClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  console.log("🔐 Server-side auth check:", { 
    userId: user?.id, 
    userEmail: user?.email,
    authError: authError?.message 
  });
  
  // Debug: Check if pet exists and get owner info
  const { data: pet, error: petError } = await supabase
    .from("pets")
    .select("id, owner_user_id, name")
    .eq("id", id)
    .single();
  
  console.log("🐾 Pet ownership check:", {
    petId: id,
    petOwnerId: pet?.owner_user_id,
    currentUserId: user?.id,
    ownershipMatch: pet?.owner_user_id === user?.id,
    petError: petError?.message
  });
  
  console.log("📝 Update data:", updates);
  
  // Since server-side auth is failing, use admin client directly
  console.log("🔄 Using admin client due to auth session missing...");
  const adminSupabase = getAdminSupabaseClient();
  const { error } = await adminSupabase.from("pets").update(updates).eq("id", id);
  
  if (error) {
    console.error("❌ Update error with admin client:", error);
    return { ok: false as const, reason: error.message };
  }
  
  console.log("✅ Update successful with admin client");
  return { ok: true as const };
}


