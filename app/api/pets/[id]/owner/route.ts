import { NextRequest, NextResponse } from "next/server";
import { createDataAccess } from "@/lib/data";
import { 
  uuidSchema, 
  validateInput, 
  withErrorHandler, 
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

export const GET = withErrorHandler(handleGetOwner);
