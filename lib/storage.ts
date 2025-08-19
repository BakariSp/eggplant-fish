import { getBrowserSupabaseClient } from "./supabase-browser";
import { v4 as uuidv4 } from "uuid";

// Storage bucket names
export const STORAGE_BUCKETS = {
  PET_AVATARS: "user-image",
  PET_POSTS: "user-image", 
  USER_UPLOADS: "user-image",
} as const;

export type StorageBucket = typeof STORAGE_BUCKETS[keyof typeof STORAGE_BUCKETS];

// Image upload types
export interface ImageUploadOptions {
  bucket: StorageBucket;
  folder?: string;
  fileName?: string;
  maxSizeBytes?: number;
  allowedTypes?: string[];
}

export interface ImageUploadResult {
  success: boolean;
  url?: string;
  path?: string;
  error?: string;
}

// Client-side image upload function
export async function uploadImage(
  file: File,
  options: ImageUploadOptions
): Promise<ImageUploadResult> {
  try {
    const supabase = getBrowserSupabaseClient();
    
    // Validate file type
    const allowedTypes = options.allowedTypes || [
      "image/jpeg",
      "image/jpg", 
      "image/png",
      "image/webp",
      "image/gif"
    ];
    
    if (!allowedTypes.includes(file.type)) {
      return {
        success: false,
        error: `File type ${file.type} is not allowed. Allowed types: ${allowedTypes.join(", ")}`
      };
    }

    // Validate file size (default 50MB)
    const maxSize = options.maxSizeBytes || 50 * 1024 * 1024;
    if (file.size > maxSize) {
      return {
        success: false,
        error: `File size ${(file.size / 1024 / 1024).toFixed(2)}MB exceeds maximum allowed size ${(maxSize / 1024 / 1024).toFixed(2)}MB`
      };
    }

    // Generate unique filename
    const fileExtension = file.name.split(".").pop()?.toLowerCase();
    const fileName = options.fileName || `${uuidv4()}.${fileExtension}`;
    const folder = options.folder || "";
    const filePath = folder ? `${folder}/${fileName}` : fileName;

    // Upload file to Supabase Storage
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

    // Get public URL
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

// Note: Server-side upload function moved to lib/storage-server.ts

// Delete image function (client-side only)
export async function deleteImage(
  bucket: StorageBucket,
  path: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = getBrowserSupabaseClient();
    
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

// Get signed URL for private images
export async function getSignedUrl(
  bucket: StorageBucket,
  path: string,
  expiresIn = 3600
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const supabase = getBrowserSupabaseClient();
    
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn);

    if (error) {
      return {
        success: false,
        error: `Failed to create signed URL: ${error.message}`
      };
    }

    return {
      success: true,
      url: data.signedUrl
    };

  } catch (error) {
    return {
      success: false,
      error: `Failed to create signed URL: ${error instanceof Error ? error.message : "Unknown error"}`
    };
  }
}

// List files in a bucket
export async function listFiles(
  bucket: StorageBucket,
  folder?: string,
  limit = 100
): Promise<{ success: boolean; files?: any[]; error?: string }> {
  try {
    const supabase = getBrowserSupabaseClient();
    
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

// Helper function to get pet avatar upload options
export function getPetAvatarUploadOptions(petId: string): ImageUploadOptions {
  return {
    bucket: STORAGE_BUCKETS.PET_AVATARS,
    folder: petId,
    maxSizeBytes: 50 * 1024 * 1024, // 50MB to match Supabase bucket limit
    allowedTypes: ["image/jpeg", "image/jpg", "image/png", "image/webp"]
  };
}

// Helper function to get pet post image upload options
export function getPetPostUploadOptions(petId: string): ImageUploadOptions {
  return {
    bucket: STORAGE_BUCKETS.PET_POSTS,
    folder: petId,
    maxSizeBytes: 50 * 1024 * 1024, // 50MB to match Supabase bucket limit
    allowedTypes: ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"]
  };
}

// Helper function to extract file path from Supabase URL
export function extractPathFromUrl(url: string, bucket: StorageBucket): string | null {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split("/");
    const bucketIndex = pathParts.findIndex(part => part === bucket);
    
    if (bucketIndex === -1) return null;
    
    return pathParts.slice(bucketIndex + 1).join("/");
  } catch {
    return null;
  }
}
