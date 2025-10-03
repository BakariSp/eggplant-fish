import { NextRequest } from "next/server";
import { getAdminSupabaseClient } from "@/lib/supabase";
import {
  uuidSchema,
  validateInput,
  createSuccessResponse,
  createInternalError,
  z,
} from "@/lib/validation";
import { notifyOwnerOnReportedLost, notifyReporterOnLostReport } from "@/lib/notifications";

const bodySchema = z.object({
  reporter_name: z.string().optional(),
  reporter_email: z.string().email().optional(),
  last_seen_location: z.string().optional(),
  message: z.string().optional(),
});

async function handleReportLost(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const validatedId = validateInput(uuidSchema, id);
  const body = await request.json();
  const { reporter_name, reporter_email, last_seen_location } = validateInput(bodySchema, body);

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

  // Update database first: mark as lost
  const updateData: Record<string, boolean | string> = {
    lost_mode: true,
  };

  // Only update lost_since if transitioning from not-lost to lost
  if (!prevLost) {
    updateData.lost_since = new Date().toISOString();
  }

  if (last_seen_location !== undefined) {
    updateData.last_seen_location = last_seen_location;
  }

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

  // Send notifications: C1 to reporter + C2 to owner (fire-and-forget)
  Promise.all([
    // C1: Send acknowledgment to reporter if email provided
    reporter_email 
      ? notifyReporterOnLostReport(
          validatedId as string,
          { name: reporter_name, email: reporter_email },
          last_seen_location
        )
      : Promise.resolve(),
    // C2: Send alert to owner
    notifyOwnerOnReportedLost(
      validatedId as string,
      { name: reporter_name, email: reporter_email },
      last_seen_location
    )
  ]).catch((e) => {
    console.error("Failed to send lost report notifications:", e);
  });

  return createSuccessResponse(
    { 
      pet: updatedPet,
      prev_lost: prevLost,
      new_lost: true,
      status_changed: !prevLost,
      message: "Thank you for reporting! The owner has been notified."
    }, 
    "Pet reported as lost"
  );
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    return await handleReportLost(request, context);
  } catch (error) {
    const path = request.url ? new URL(request.url).pathname : undefined;
    const { createErrorResponse } = await import("@/lib/validation");
    return createErrorResponse(error as Error, path);
  }
}
