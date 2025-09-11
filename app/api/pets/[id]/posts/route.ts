import { NextRequest, NextResponse } from "next/server";
import { createDataAccess } from "@/lib/data";
import { 
  uuidSchema, 
  validateInput, 
  withErrorHandler, 
  createSuccessResponse,
  createInternalError
} from "@/lib/validation";

async function handleGetPosts(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  // Validate pet ID format
  const validatedId = validateInput(uuidSchema, id);
  
  const dataAccess = await createDataAccess();
  
  // Get posts for this pet using data access layer
  const { posts, error } = await dataAccess.posts().getPostsByPetId(validatedId as string);

  if (error) {
    console.error("Posts fetch error:", error);
    throw createInternalError("Failed to fetch posts", { originalError: error });
  }

  return createSuccessResponse(
    { posts, count: posts.length }, 
    posts.length > 0 ? `Found ${posts.length} posts` : "No posts found"
  );
}

export const GET = withErrorHandler(handleGetPosts);
