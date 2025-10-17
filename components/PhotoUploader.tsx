"use client";

import { useRef, useState } from "react";
import { useImageUpload } from "../lib/hooks/useImageUpload";
import { maybeCompressImage } from "@/lib/image";
// @ts-ignore - bundlers handle worker imports or can be adapted
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import CompressWorker from "@/lib/workers/image-compress.worker.ts?worker";
import type { CompressOptions } from "@/lib/image";
import { ImageUploadOptions } from "../lib/storage";

interface PhotoUploaderProps {
  uploadOptions: ImageUploadOptions;
  onUploadComplete?: (result: { success: boolean; url?: string; path?: string; error?: string }) => void;
  onUploadStart?: () => void;
  multiple?: boolean;
  className?: string;
  children?: React.ReactNode;
  disabled?: boolean;
  compressOptions?: CompressOptions;
  capture?: "environment" | "user";
  maxFilesRemaining?: number;
}

export default function PhotoUploader({
  uploadOptions,
  onUploadComplete,
  onUploadStart,
  multiple = false,
  className = "",
  children,
  disabled = false,
  compressOptions,
  capture,
  maxFilesRemaining,
}: PhotoUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isUploading, progress, error, upload, reset, abort } = useImageUpload();
  const [dragOver, setDragOver] = useState(false);

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    if (typeof maxFilesRemaining === "number" && maxFilesRemaining <= 0) return;

    onUploadStart?.();
    
    // For multiple files, upload them one by one
    if (multiple) {
      const total = typeof maxFilesRemaining === "number" ? Math.min(files.length, Math.max(0, maxFilesRemaining)) : files.length;
      for (let i = 0; i < total; i++) {
        const f = files[i];
        // Friendly skip for HEIC/HEIF to avoid upload surprises on non-iOS browsers
        if (/heic|heif/i.test(f.type) || /\.(heic|heif)$/i.test(f.name)) {
          // eslint-disable-next-line no-alert
          alert("HEIC/HEIF 图片暂不支持直接上传，请先转换为 JPG/PNG/WebP 再试。");
          continue;
        }
        // Compress before upload to reduce device heat and bandwidth
        // Try Web Worker compression first
        let compressed = f;
        try {
          const worker = new CompressWorker();
          compressed = await new Promise<File>((resolve) => {
            const opts = compressOptions || { maxDimension: 1600, quality: 0.82, mimeType: "image/webp" };
            worker.onmessage = (e: MessageEvent) => {
              // @ts-ignore
              const data = e.data as { ok: boolean; file?: File };
              resolve(data.ok && data.file ? data.file : f);
              worker.terminate();
            };
            worker.postMessage({ file: f, options: opts });
          });
        } catch {
          compressed = await maybeCompressImage(f, compressOptions || { maxDimension: 1600, quality: 0.82, mimeType: "image/webp", yieldIdleForLargeFiles: true });
        }
        const result = await upload(compressed, uploadOptions);
        onUploadComplete?.(result);
      }
    } else {
      // Single file upload
      const f = files[0];
      if (/heic|heif/i.test(f.type) || /\.(heic|heif)$/i.test(f.name)) {
        alert("HEIC/HEIF 图片暂不支持直接上传，请先转换为 JPG/PNG/WebP 再试。");
        return;
      }
      let compressed = f;
      try {
        const worker = new CompressWorker();
        compressed = await new Promise<File>((resolve) => {
          const opts = compressOptions || { maxDimension: 1600, quality: 0.82, mimeType: "image/webp" };
          worker.onmessage = (e: MessageEvent) => {
            // @ts-ignore
            const data = e.data as { ok: boolean; file?: File };
            resolve(data.ok && data.file ? data.file : f);
            worker.terminate();
          };
          worker.postMessage({ file: f, options: opts });
        });
      } catch {
        compressed = await maybeCompressImage(f, compressOptions || { maxDimension: 1600, quality: 0.82, mimeType: "image/webp", yieldIdleForLargeFiles: true });
      }
      const result = await upload(compressed, uploadOptions);
      onUploadComplete?.(result);
    }
  };

  const handleClick = () => {
    if (!disabled && !isUploading && !(typeof maxFilesRemaining === "number" && maxFilesRemaining <= 0)) {
      fileInputRef.current?.click();
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled && !isUploading) {
      setDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    if (disabled || isUploading) return;

    const files = e.dataTransfer.files;
    handleFileSelect(files);
  };

  return (
    <div className={`relative ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple={multiple}
        onChange={(e) => handleFileSelect(e.target.files)}
        className="hidden"
        disabled={disabled || isUploading || (typeof maxFilesRemaining === "number" && maxFilesRemaining <= 0)}
        {...(capture ? { capture } : {})}
      />
      
      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          cursor-pointer transition-all duration-200
          ${dragOver ? "bg-[var(--brand-50)] border-[color:var(--brand-300)]" : ""}
          ${disabled || isUploading ? "cursor-not-allowed opacity-50" : "hover:bg-[var(--brand-50)]"}
          ${className.includes("border") ? "" : "border-2 border-dashed border-[color:var(--brand-300)] rounded-lg p-4"}
        `}
      >
        {children || (
          <div className="text-center">
            <div className="text-gray-600 mb-2">
              {isUploading ? (
                <div>
                  <div className="text-sm">Uploading... {progress}%</div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>
              ) : (
                <>
                  <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <div className="text-sm">
                    Click to upload or drag and drop
                  </div>
                  <div className="text-xs text-gray-500">
                    PNG, JPG, WebP up to {Math.round((uploadOptions.maxSizeBytes || 5 * 1024 * 1024) / 1024 / 1024)}MB
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">
          {error}
          <button
            onClick={reset}
            className="ml-2 text-red-800 hover:text-red-900 underline"
          >
            Try again
          </button>
          <button
            onClick={abort}
            className="ml-3 text-red-800 hover:text-red-900 underline"
          >
            Cancel upload
          </button>
        </div>
      )}
    </div>
  );
}


