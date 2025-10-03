import { NextRequest } from "next/server";
import { createDataAccess } from "@/lib/data";
import { 
  uuidSchema, 
  validateInput, 
  createSuccessResponse,
  createNotFoundError
} from "@/lib/validation";

async function handleGetPet(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  console.log("Fetching pet with ID:", id);
  
  // Validate pet ID format
  const validatedId = validateInput(uuidSchema, id);
  
  const dataAccess = await createDataAccess();
  
  // Get pet with full details using data access layer
  const { pet, error } = await dataAccess.pets().getPetById(validatedId);

  if (error) {
    console.error("Pet fetch error:", error);
    throw createNotFoundError("Pet not found");
  }

  if (!pet) {
    throw createNotFoundError("Pet not found");
  }

  console.log("Found pet:", pet.name);

  return createSuccessResponse({ pet }, `Successfully retrieved pet: ${pet.name}`);
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    return await handleGetPet(request, context);
  } catch (error) {
    const path = request.url ? new URL(request.url).pathname : undefined;
    const { createErrorResponse } = await import("@/lib/validation");
    return createErrorResponse(error as Error, path);
  }
}
