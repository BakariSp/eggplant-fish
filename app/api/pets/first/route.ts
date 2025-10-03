import { NextRequest } from "next/server";
import { createDataAccess } from "@/lib/data";
import { 
  createSuccessResponse,
  createNotFoundError
} from "@/lib/validation";

async function handleGetFirstPet(_request: NextRequest) {
  const dataAccess = await createDataAccess();
  
  // Get the first pet using data access layer
  const { pet, error } = await dataAccess.pets().getFirstPet();

  if (error || !pet) {
    throw createNotFoundError("No pets found");
  }

  return createSuccessResponse({
    pet,
    urls: {
      posts: `/dashboard/pets/${(pet as { tag_code?: string }).tag_code || pet.id}/posts`,
      edit: `/dashboard/pets/${(pet as { tag_code?: string }).tag_code || pet.id}/edit`,
      public: `/p/${(pet as { tag_code?: string }).tag_code || pet.id}`
    }
  }, `Successfully retrieved first pet: ${pet.name}`);
}

export async function GET(request: NextRequest) {
  try {
    return await handleGetFirstPet(request);
  } catch (error) {
    const path = request.url ? new URL(request.url).pathname : undefined;
    const { createErrorResponse } = await import("@/lib/validation");
    return createErrorResponse(error as Error, path);
  }
}
