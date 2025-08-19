"use client";

import { useState } from "react";
import PhotoUploader from "../PhotoUploader";
import { getPetPostUploadOptions } from "../../lib/storage";

interface PetPostImageUploaderProps {
  petId: string;
  onImagesUploaded?: (urls: string[]) => void;
  maxImages?: number;
}

export default function PetPostImageUploader({
  petId,
  onImagesUploaded,
  maxImages = 4
}: PetPostImageUploaderProps) {
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const handleUploadStart = () => {
    setIsUploading(true);
  };

  const handleUploadComplete = (result: { success: boolean; url?: string; error?: string }) => {
    if (result.success && result.url) {
      const newImages = [...uploadedImages, result.url];
      setUploadedImages(newImages);
      onImagesUploaded?.(newImages);
    }
    
    // Check if this was the last upload in a batch
    setTimeout(() => {
      setIsUploading(false);
    }, 500);
  };

  const removeImage = (indexToRemove: number) => {
    const newImages = uploadedImages.filter((_, index) => index !== indexToRemove);
    setUploadedImages(newImages);
    onImagesUploaded?.(newImages);
  };

  const canUploadMore = uploadedImages.length < maxImages;

  return (
    <div className="space-y-4">
      {/* Uploaded Images Grid */}
      {uploadedImages.length > 0 && (
        <div className="grid grid-cols-2 gap-4">
          {uploadedImages.map((url, index) => (
            <div key={index} className="relative group">
              <img
                src={url}
                alt={`Upload ${index + 1}`}
                className="w-full h-32 object-cover rounded-lg border-2 border-gray-200"
              />
              <button
                onClick={() => removeImage(index)}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm opacity-0 group-hover:opacity-100 transition-opacity"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload Area */}
      {canUploadMore && (
        <PhotoUploader
          uploadOptions={getPetPostUploadOptions(petId)}
          onUploadStart={handleUploadStart}
          onUploadComplete={handleUploadComplete}
          multiple={true}
          className="w-full"
          disabled={isUploading || !canUploadMore}
        >
          <div className="text-center py-8">
            <div className="text-sm text-gray-600 mb-2">
              Upload Post Images ({uploadedImages.length}/{maxImages})
            </div>
            <div className="text-xs text-gray-500">
              Click or drag to upload photos (you can select multiple, up to 50MB each)
            </div>
          </div>
        </PhotoUploader>
      )}

      {/* Status */}
      {!canUploadMore && (
        <div className="text-center py-4 text-gray-500 text-sm">
          Maximum number of images reached ({maxImages})
        </div>
      )}
    </div>
  );
}
