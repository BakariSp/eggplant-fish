"use server";

import { uploadImageServer } from "../../lib/storage-server";
import { ImageUploadOptions, ImageUploadResult } from "../../lib/storage";

export async function uploadImageAction(
  formData: FormData,
  options: ImageUploadOptions
): Promise<ImageUploadResult> {
  try {
    const file = formData.get("file") as File;
    
    if (!file) {
      return {
        success: false,
        error: "No file provided"
      };
    }

    // Convert File to Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate filename with timestamp and original extension
    const timestamp = Date.now();
    const originalName = file.name.split(".")[0];
    const extension = file.name.split(".").pop()?.toLowerCase();
    const fileName = options.fileName || `${originalName}_${timestamp}.${extension}`;

    return await uploadImageServer(buffer, fileName, options);

  } catch (error) {
    return {
      success: false,
      error: `Server upload failed: ${error instanceof Error ? error.message : "Unknown error"}`
    };
  }
}
