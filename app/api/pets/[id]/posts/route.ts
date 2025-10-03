import { NextRequest } from "next/server";
import { createDataAccess } from "@/lib/data";
import { 
  uuidSchema, 
  validateInput, 
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

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    return await handleGetPosts(request, context);
  } catch (error) {
    const path = request.url ? new URL(request.url).pathname : undefined;
    const { createErrorResponse } = await import("@/lib/validation");
    return createErrorResponse(error as Error, path);
  }
}
