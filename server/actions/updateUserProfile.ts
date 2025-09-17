"use server";

import { z } from "zod";
import { getAdminSupabaseClient } from "@/lib/supabase";

const Input = z.object({
  userId: z.string().uuid(),
  fullName: z.string().min(1).max(100).optional(),
  avatarUrl: z.string().url().optional(),
});

export async function updateUserProfile(raw: unknown) {
  const parsed = Input.safeParse(raw);
  if (!parsed.success) return { ok: false as const, reason: "Invalid input" };
  
  const { userId, fullName, avatarUrl } = parsed.data;
  
  try {
    const adminSupabase = getAdminSupabaseClient();
    
    // Update user metadata
    const { error } = await adminSupabase.auth.admin.updateUserById(userId, {
      user_metadata: {
        full_name: fullName || null,
        avatar_url: avatarUrl || undefined,
        picture: avatarUrl || undefined,
      }
    });
    
    if (error) {
      console.error("Failed to update user profile:", error);
      return { ok: false as const, reason: error.message };
    }
    
    return { ok: true as const };
  } catch (error) {
    console.error("Error updating user profile:", error);
    return { 
      ok: false as const, 
      reason: error instanceof Error ? error.message : "Unknown error" 
    };
  }
}
