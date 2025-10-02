import { NextRequest, NextResponse } from "next/server";
import { createDataAccess } from "@/lib/data";
import { 
  withErrorHandler, 
  createSuccessResponse,
  createNotFoundError
} from "@/lib/validation";

async function handleGetFirstPet(request: NextRequest) {
  const dataAccess = await createDataAccess();
  
  // Get the first pet using data access layer
  const { pet, error } = await dataAccess.pets().getFirstPet();

  if (error || !pet) {
    throw createNotFoundError("No pets found");
  }

  return createSuccessResponse({
    pet,
    urls: {
      posts: `/dashboard/pets/${(pet as any).tag_code || pet.id}/posts`,
      edit: `/dashboard/pets/${(pet as any).tag_code || pet.id}/edit`,
      public: `/p/${(pet as any).tag_code || pet.id}`
    }
  }, `Successfully retrieved first pet: ${pet.name}`);
}

export const GET = withErrorHandler(handleGetFirstPet);
