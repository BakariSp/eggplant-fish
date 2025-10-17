"use client";

import { useState } from "react";
import Image from "next/image";
import PhotoUploader from "../PhotoUploader";
import { getPetAvatarUploadOptions } from "../../lib/storage";

interface PetAvatarUploaderProps {
  petId: string;
  currentAvatarUrl?: string;
  onAvatarUpdate?: (url: string) => void;
}

export default function PetAvatarUploader({
  petId,
  currentAvatarUrl,
  onAvatarUpdate
}: PetAvatarUploaderProps) {
  const [avatarUrl, setAvatarUrl] = useState(currentAvatarUrl);
  const [isUploading, setIsUploading] = useState(false);

  const handleUploadStart = () => {
    setIsUploading(true);
  };

  const handleUploadComplete = (result: { success: boolean; url?: string; error?: string }) => {
    setIsUploading(false);
    
    if (result.success && result.url) {
      setAvatarUrl(result.url);
      onAvatarUpdate?.(result.url);
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      {/* Current Avatar Preview */}
      <div className="relative">
        <div className="relative w-32 h-32 rounded-full overflow-hidden bg-gray-200 border-4 border-white shadow-lg">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt="Pet Avatar"
              fill
              sizes="128px"
              className="object-cover"
              priority
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
              </svg>
            </div>
          )}
        </div>
        
        {isUploading && (
          <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        )}
      </div>

      {/* Upload Area */}
      <PhotoUploader
        uploadOptions={getPetAvatarUploadOptions(petId)}
        onUploadStart={handleUploadStart}
        onUploadComplete={handleUploadComplete}
        className="w-full max-w-sm"
        disabled={isUploading}
      >
        <div className="text-center py-6">
          <div className="text-sm text-gray-600 mb-2">
            {avatarUrl ? "Change Avatar" : "Upload Avatar"}
          </div>
          <div className="text-xs text-gray-500">
            Click or drag to upload a new photo (up to 50MB)
          </div>
        </div>
      </PhotoUploader>
    </div>
  );
}
