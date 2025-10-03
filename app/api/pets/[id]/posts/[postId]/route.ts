import { NextRequest } from 'next/server';
import { getAdminSupabaseClient } from '@/lib/supabase';
import { 
  uuidSchema, 
  validateInput, 
  createSuccessResponse,
  createInternalError
} from '@/lib/validation';

async function handleDeletePost(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; postId: string }> }
) {
  const { id: petId, postId } = await params;
  
  // Validate IDs format
  const validatedPetId = validateInput(uuidSchema, petId);
  const validatedPostId = validateInput(uuidSchema, postId);
  
  // Use admin client to bypass RLS
  const supabase = getAdminSupabaseClient();
  
  // Delete the post directly
  const { error } = await supabase
    .from('pet_posts')
    .delete()
    .eq('id', validatedPostId as string)
    .eq('pet_id', validatedPetId as string);

  if (error) {
    console.error("Post deletion error:", error);
    throw createInternalError("Failed to delete post", { originalError: error });
  }

  return createSuccessResponse(
    { success: true }, 
    "Post deleted successfully"
  );
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string; postId: string }> }
) {
  try {
    return await handleDeletePost(request, context);
  } catch (error) {
    const path = request.url ? new URL(request.url).pathname : undefined;
    const { createErrorResponse } = await import('@/lib/validation');
    return createErrorResponse(error as Error, path);
  }
}
