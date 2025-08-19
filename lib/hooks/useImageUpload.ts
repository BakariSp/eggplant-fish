"use client";

import { useState, useCallback } from "react";
import { uploadImage, ImageUploadOptions, ImageUploadResult } from "../storage";

export interface UseImageUploadState {
  isUploading: boolean;
  progress: number;
  error: string | null;
  result: ImageUploadResult | null;
}

export interface UseImageUploadReturn extends UseImageUploadState {
  upload: (file: File, options: ImageUploadOptions) => Promise<ImageUploadResult>;
  reset: () => void;
}

export function useImageUpload(): UseImageUploadReturn {
  const [state, setState] = useState<UseImageUploadState>({
    isUploading: false,
    progress: 0,
    error: null,
    result: null,
  });

  const upload = useCallback(async (
    file: File,
    options: ImageUploadOptions
  ): Promise<ImageUploadResult> => {
    setState(prev => ({
      ...prev,
      isUploading: true,
      progress: 0,
      error: null,
      result: null,
    }));

    try {
      // Simulate progress for better UX
      setState(prev => ({ ...prev, progress: 25 }));
      
      const result = await uploadImage(file, options);
      
      setState(prev => ({ ...prev, progress: 100 }));
      
      setState(prev => ({
        ...prev,
        isUploading: false,
        result,
        error: result.success ? null : result.error || "Upload failed",
      }));

      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Upload failed";
      
      setState(prev => ({
        ...prev,
        isUploading: false,
        progress: 0,
        error: errorMessage,
        result: { success: false, error: errorMessage },
      }));

      return { success: false, error: errorMessage };
    }
  }, []);

  const reset = useCallback(() => {
    setState({
      isUploading: false,
      progress: 0,
      error: null,
      result: null,
    });
  }, []);

  return {
    ...state,
    upload,
    reset,
  };
}
