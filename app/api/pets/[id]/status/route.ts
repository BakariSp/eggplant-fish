import { NextRequest } from "next/server";
import { getAdminSupabaseClient, getServerSupabaseClient } from "@/lib/supabase";
import {
  uuidSchema,
  validateInput,
  createSuccessResponse,
  createInternalError,
  createUnauthorizedError,
  z,
} from "@/lib/validation";
import { notifyOwnerOnLost, notifyOwnerOnFound } from "@/lib/notifications";

const bodySchema = z.object({
  status: z.enum(['lost', 'found']),
  last_seen_location: z.string().optional(),
  lost_message: z.string().optional(),
});

async function handleUpdateStatus(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const validatedId = validateInput(uuidSchema, id);
  const body = await request.json();
  const { status, last_seen_location, lost_message } = validateInput(bodySchema, body);

  const adminSupabase = getAdminSupabaseClient();

  // Get current pet data
  const { data: pet, error: petError } = await adminSupabase
    .from("pets")
    .select("id,name,owner_user_id,lost_mode")
    .eq("id", validatedId as string)
    .maybeSingle();

  if (petError || !pet) {
    throw createInternalError("Pet not found", { originalError: petError });
  }

  const prevLost = !!pet.lost_mode;

  // Authorization check: only owner can set status to 'found'
  if (status === 'found') {
    try {
      // Try to get authorization from header first
      const authHeader = request.headers.get('authorization');
      let currentUserId: string | null = null;
      
      console.log('🔍 API Auth check:', {
        hasAuthHeader: !!authHeader,
        authHeaderType: authHeader?.substring(0, 20) + '...',
        petOwnerId: pet.owner_user_id
      });
      
      if (authHeader?.startsWith('Bearer ')) {
        // Use admin client to verify the token
        const token = authHeader.substring(7);
        try {
          const adminSupabase = getAdminSupabaseClient();
          const { data: { user }, error } = await adminSupabase.auth.getUser(token);
          if (!error && user) {
            currentUserId = user.id;
            console.log('✅ Token verified, user ID:', currentUserId);
          } else {
            console.log('❌ Token verification failed:', error?.message);
          }
        } catch (e) {
          console.log('❌ Token verification exception:', (e as Error).message);
          // Token verification failed, fall back to server client
        }
      } else {
        console.log('⚠️ No Bearer token in Authorization header');
      }
      
      // Fallback to server client session
      if (!currentUserId) {
        console.log('🔄 Falling back to server client session');
        const supabase = await getServerSupabaseClient();
        const { data: { session } } = await supabase.auth.getSession();
        currentUserId = session?.user?.id || null;
        console.log('Server session user ID:', currentUserId);
      }
      
      console.log('🎯 Final auth check:', {
        currentUserId,
        petOwnerId: pet.owner_user_id,
        isOwner: currentUserId === pet.owner_user_id
      });
      
      if (!currentUserId || currentUserId !== pet.owner_user_id) {
        throw createUnauthorizedError("Only the pet owner can mark as found");
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes("Unauthorized")) {
        throw error;
      }
      throw createUnauthorizedError("Authentication required to mark as found");
    }
  }

  // Prepare update data
  const updateData: Record<string, boolean | string | null> = {
    lost_mode: status === 'lost'
  };

  if (status === 'lost') {
    // Only update lost_since if transitioning from not-lost to lost
    if (!prevLost) {
      updateData.lost_since = new Date().toISOString();
    }
    if (lost_message !== undefined) {
      updateData.lost_message = lost_message;
    }
    // Note: last_seen_location is passed to email but not stored in DB
  } else if (status === 'found') {
    updateData.lost_since = null;
    updateData.lost_message = null;
  }

  // Update database first
  const { data: updatedPet, error: updateError } = await adminSupabase
    .from("pets")
    .update(updateData)
    .eq("id", validatedId as string)
    .select("*")
    .single();

  if (updateError) {
    console.error("Update pet status error:", updateError);
    throw createInternalError("Failed to update pet status", { originalError: updateError });
  }

  // Send notifications every time (fire-and-forget)
  const newLost = status === 'lost';
  if (status === 'lost') {
    notifyOwnerOnLost(validatedId as string, { last_seen_location }).catch((e) => {
      console.error("Failed to send lost notification:", e);
    });
  } else if (status === 'found') {
    notifyOwnerOnFound(validatedId as string).catch((e) => {
      console.error("Failed to send found notification:", e);
    });
  }

  return createSuccessResponse(
    { 
      pet: updatedPet,
      prev_lost: prevLost,
      new_lost: newLost,
      status_changed: prevLost !== newLost,
      notification_sent: true
    }, 
    `Pet status set to ${status}, notification sent`
  );
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    return await handleUpdateStatus(request, context);
  } catch (error) {
    const path = request.url ? new URL(request.url).pathname : undefined;
    const { createErrorResponse } = await import("@/lib/validation");
    return createErrorResponse(error as Error, path);
  }
}
