import { NextRequest } from "next/server";
import { createDataAccess } from "@/lib/data";
import { 
  uuidSchema, 
  validateInput, 
  createSuccessResponse,
  createNotFoundError
} from "@/lib/validation";

async function handleGetOwner(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  // Validate pet ID format
  const validatedId = validateInput(uuidSchema, id) as string;
  
  const dataAccess = await createDataAccess();
  
  // Get owner information using data access layer
  const { owner, error } = await dataAccess.owners().getOwnerByPetId(validatedId);

  if (error) {
    console.error("Owner fetch error:", error);
    throw createNotFoundError("Owner not found");
  }

  if (!owner) {
    throw createNotFoundError("Owner not found");
  }

  return createSuccessResponse({ owner }, `Successfully retrieved owner information`);
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    return await handleGetOwner(request, context);
  } catch (error) {
    const path = request.url ? new URL(request.url).pathname : undefined;
    const { createErrorResponse } = await import("@/lib/validation");
    return createErrorResponse(error as Error, path);
  }
}
