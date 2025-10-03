import { NextRequest } from "next/server";
import { getAdminSupabaseClient } from "@/lib/supabase";
import { notifyOwnerOnLost } from "@/lib/notifications";
import {
  uuidSchema,
  validateInput,
  createSuccessResponse,
  createInternalError,
  z,
} from "@/lib/validation";

const bodySchema = z.object({
  lost_mode: z.boolean(),
});

async function handleToggleLost(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const validatedId = validateInput(uuidSchema, id);
  const body = await request.json();
  const { lost_mode } = validateInput(bodySchema, body) as { lost_mode: boolean };

  const supabase = getAdminSupabaseClient();

  const updateData: { lost_mode: boolean; lost_since: string | null } = {
    lost_mode,
    lost_since: lost_mode ? new Date().toISOString() : null,
  };

  const { data, error } = await supabase
    .from("pets")
    .update(updateData)
    .eq("id", validatedId as string)
    .select("*")
    .single();

  if (error) {
    console.error("Toggle lost mode error:", error);
    throw createInternalError("Failed to toggle lost mode", { originalError: error });
  }

  // Fire-and-forget notifications when enabling lost
  if (lost_mode) {
    notifyOwnerOnLost(validatedId as string).catch(() => {});
  }

  return createSuccessResponse({ pet: data }, `Pet lost mode set to ${lost_mode}`);
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    return await handleToggleLost(request, context);
  } catch (error) {
    const path = request.url ? new URL(request.url).pathname : undefined;
    const { createErrorResponse } = await import("@/lib/validation");
    return createErrorResponse(error as Error, path);
  }
}



