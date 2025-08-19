import { getServerSupabaseClient, getAdminSupabaseClient } from "./supabase";
import { v4 as uuidv4 } from "uuid";
import { STORAGE_BUCKETS, ImageUploadOptions, ImageUploadResult, StorageBucket } from "./storage";

// Server-side image upload function
export async function uploadImageServer(
  file: Buffer | Uint8Array,
  fileName: string,
  options: ImageUploadOptions
): Promise<ImageUploadResult> {
  try {
    const supabase = await getServerSupabaseClient();
    
    const folder = options.folder || "";
    const filePath = folder ? `${folder}/${fileName}` : fileName;

    const { data, error } = await supabase.storage
      .from(options.bucket)
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: true,
      });

    if (error) {
      return {
        success: false,
        error: `Upload failed: ${error.message}`
      };
    }

    const { data: urlData } = supabase.storage
      .from(options.bucket)
      .getPublicUrl(data.path);

    return {
      success: true,
      url: urlData.publicUrl,
      path: data.path
    };

  } catch (error) {
    return {
      success: false,
      error: `Upload failed: ${error instanceof Error ? error.message : "Unknown error"}`
    };
  }
}

// Server-side delete function with admin privileges
export async function deleteImageServer(
  bucket: StorageBucket,
  path: string,
  useAdmin = false
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = useAdmin ? getAdminSupabaseClient() : await getServerSupabaseClient();
    
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);

    if (error) {
      return {
        success: false,
        error: `Delete failed: ${error.message}`
      };
    }

    return { success: true };

  } catch (error) {
    return {
      success: false,
      error: `Delete failed: ${error instanceof Error ? error.message : "Unknown error"}`
    };
  }
}

// Server-side list files function
export async function listFilesServer(
  bucket: StorageBucket,
  folder?: string,
  limit = 100
): Promise<{ success: boolean; files?: any[]; error?: string }> {
  try {
    const supabase = await getServerSupabaseClient();
    
    const { data, error } = await supabase.storage
      .from(bucket)
      .list(folder, {
        limit,
        sortBy: { column: "created_at", order: "desc" }
      });

    if (error) {
      return {
        success: false,
        error: `Failed to list files: ${error.message}`
      };
    }

    return {
      success: true,
      files: data
    };

  } catch (error) {
    return {
      success: false,
      error: `Failed to list files: ${error instanceof Error ? error.message : "Unknown error"}`
    };
  }
}
