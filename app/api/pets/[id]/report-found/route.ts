import { NextRequest } from "next/server";
import { getAdminSupabaseClient } from "@/lib/supabase";
import {
  uuidSchema,
  validateInput,
  createSuccessResponse,
  createInternalError,
  z,
} from "@/lib/validation";
import { notifyOnFoundReport } from "@/lib/notifications";

const bodySchema = z.object({
  finder_name: z.string().optional(),
  finder_email: z.string().email().optional(),
  found_location: z.string().optional(),
  message: z.string().optional(),
});

async function handleReportFound(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const validatedId = validateInput(uuidSchema, id);
  const body = await request.json();
  const { finder_name, finder_email, found_location } = validateInput(bodySchema, body);

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

  // Update database first: mark as found
  const updateData = {
    lost_mode: false,
    lost_since: null,
  };

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

  // Send notifications (fire-and-forget)
  notifyOnFoundReport(
    validatedId as string,
    { name: finder_name, email: finder_email },
    found_location
  ).catch((e) => {
    console.error("Failed to send found report notifications:", e);
  });

  return createSuccessResponse(
    { 
      pet: updatedPet,
      prev_lost: prevLost,
      new_lost: false,
      status_changed: prevLost,
      message: "Thank you for reporting! The owner has been notified."
    }, 
    "Pet reported as found"
  );
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    return await handleReportFound(request, context);
  } catch (error) {
    const path = request.url ? new URL(request.url).pathname : undefined;
    const { createErrorResponse } = await import("@/lib/validation");
    return createErrorResponse(error as Error, path);
  }
}
