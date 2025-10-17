"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Image from "next/image";
import { createPost } from "@/server/actions/createPost";
import { uploadImage } from "@/lib/storage";

type Props = {
  petId: string;
  onPostCreated?: () => void;
  onCancel?: () => void; // 新增：取消回调
};

export default function PostComposer({ petId, onPostCreated, onCancel }: Props) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);

  // 弹窗进入动画
  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).slice(0, 3);
    setImages(files);
    setCurrentImageIndex(0);
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setCurrentImageIndex(prev => Math.min(prev, images.length - 2));
  };

  // Touch/Mouse handlers for swipe gestures
  const handleStart = useCallback((clientX: number) => {
    if (images.length <= 1) return;
    setIsDragging(true);
    setDragStartX(clientX);
    setDragOffset(0);
  }, [images.length]);

  const handleMove = useCallback((clientX: number) => {
    if (!isDragging || images.length <= 1) return;
    const offset = clientX - dragStartX;
    setDragOffset(offset);
  }, [isDragging, dragStartX, images.length]);

  const handleEnd = useCallback(() => {
    if (!isDragging || images.length <= 1) return;
    
    const threshold = 50; // Minimum swipe distance
    const containerWidth = imageContainerRef.current?.offsetWidth || 300;
    
    if (Math.abs(dragOffset) > threshold) {
      if (dragOffset > 0 && currentImageIndex > 0) {
        // Swipe right - previous image
        setCurrentImageIndex(prev => prev - 1);
      } else if (dragOffset < 0 && currentImageIndex < images.length - 1) {
        // Swipe left - next image
        setCurrentImageIndex(prev => prev + 1);
      }
    }
    
    setIsDragging(false);
    setDragOffset(0);
  }, [isDragging, dragOffset, currentImageIndex, images.length]);

  // Mouse events
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    handleStart(e.clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    handleMove(e.clientX);
  };

  const handleMouseUp = () => {
    handleEnd();
  };

  // Touch events
  const handleTouchStart = (e: React.TouchEvent) => {
    handleStart(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault(); // Prevent scrolling
    handleMove(e.touches[0].clientX);
  };

  const handleTouchEnd = () => {
    handleEnd();
  };

  // Add global mouse move/up listeners when dragging
  useEffect(() => {
    if (isDragging) {
      const handleGlobalMouseMove = (e: MouseEvent) => handleMove(e.clientX);
      const handleGlobalMouseUp = () => handleEnd();
      
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleGlobalMouseMove);
        document.removeEventListener('mouseup', handleGlobalMouseUp);
      };
    }
  }, [isDragging, handleMove, handleEnd]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      // Upload images to Supabase storage first
      const imageUrls: string[] = [];
      
      for (const file of images) {
        const uploadResult = await uploadImage(file, {
          bucket: "user-image",
          folder: `posts/${petId}`,
          allowedTypes: ["image/jpeg", "image/jpg", "image/png", "image/webp"],
          maxSizeBytes: 10 * 1024 * 1024, // 10MB
        });

        if (uploadResult.success && uploadResult.url) {
          imageUrls.push(uploadResult.url);
        } else {
          console.error("Image upload failed:", uploadResult.error);
          alert(`Image upload failed: ${uploadResult.error}`);
          return;
        }
      }
      
      const result = await createPost({
        petId,
        title: title.trim(),
        content: content.trim(),
        images: imageUrls,
      });

      if (result.ok) {
        setTitle("");
        setContent("");
        setImages([]);
        onPostCreated?.();
      } else {
        alert(`Error: ${result.reason}`);
      }
    } catch (error) {
      console.error("Post creation failed:", error);
      alert("Failed to create post");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      {/* 半透明背景遮罩 */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300"
        onClick={onCancel}
      />
      
      {/* 弹窗内容 */}
      <div className={`relative w-full max-w-2xl max-h-[90vh] overflow-y-auto transform transition-all duration-300 ${isVisible ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'}`}>
        <section className="rounded-2xl border border-[color:var(--brand-200)] soft-shadow p-4 bg-white space-y-3">
          {/* 关闭按钮 */}
          <button
            type="button"
            onClick={onCancel}
            className="absolute top-1 right-1 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors z-10"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex gap-3">
          <div className="w-10 h-10 rounded-full bg-[color:var(--brand-100)] flex items-center justify-center">
            <span className="text-sm font-medium" style={{ color: "var(--brand-700)" }}>🐾</span>
          </div>
          <div className="flex-1 space-y-2">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Post title..."
              className="w-full rounded-lg border border-[color:var(--brand-200)] px-3 py-2 text-sm text-black placeholder:text-black focus:outline-none focus:ring-2 focus:ring-[color:var(--brand-300)] focus:font-semibold"
              style={{ WebkitTextFillColor: "#000000", color: "#000000" }}
              maxLength={100}
            />
            <div className="relative">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What's your pet up to today?"
                className="w-full h-28 rounded-lg border border-[color:var(--brand-200)] px-3 py-2 pr-10 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[color:var(--brand-300)] text-black placeholder:text-black"
                style={{ WebkitTextFillColor: "#000000", color: "#000000" }}
                maxLength={500}
              />
              <div className="pointer-events-none absolute bottom-2 right-3 text-[10px] text-gray-400">
                {`${content.length}/500`}
              </div>
            </div>
            
            {/* Image Carousel */}
            {images.length > 0 ? (
              <div className="space-y-3">
                {/* Main Image Display */}
                <div 
                  ref={imageContainerRef}
                  className="relative h-48 rounded-lg overflow-hidden border border-[color:var(--brand-200)] bg-gray-50 select-none"
                  onMouseDown={handleMouseDown}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                  style={{ 
                    cursor: images.length > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
                    touchAction: 'pan-y pinch-zoom' 
                  }}
                >
                  <div
                    className="flex h-full transition-transform duration-300 ease-out"
                    style={{
                      transform: `translateX(${-currentImageIndex * 100 + (isDragging ? (dragOffset / (imageContainerRef.current?.offsetWidth || 300)) * 100 : 0)}%)`,
                    }}
                  >
                    {images.map((image, index) => (
                      <div key={index} className="relative h-full flex-shrink-0" style={{ width: '100%' }}>
                        <Image
                          src={URL.createObjectURL(image)}
                          alt={`Upload ${index + 1}`}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, 400px"
                          draggable={false}
                        />
                      </div>
                    ))}
                  </div>
                  
                  {/* Remove Current Image Button */}
                  <button
                    type="button"
                    onClick={() => removeImage(currentImageIndex)}
                    className="absolute top-2 right-2 w-6 h-6 rounded-full bg-red-500 text-white text-sm flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors"
                  >
                    ×
                  </button>
                  
                  {/* Navigation Arrows (Desktop) */}
                  {images.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={() => setCurrentImageIndex(prev => Math.max(0, prev - 1))}
                        className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 sm:opacity-100 hover:bg-black/70 transition-all"
                        disabled={currentImageIndex === 0}
                      >
                        ‹
                      </button>
                      <button
                        type="button"
                        onClick={() => setCurrentImageIndex(prev => Math.min(images.length - 1, prev + 1))}
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 sm:opacity-100 hover:bg-black/70 transition-all"
                        disabled={currentImageIndex === images.length - 1}
                      >
                        ›
                      </button>
                    </>
                  )}
                  
                  {/* Mobile Swipe Hint */}
                  {images.length > 1 && (
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs text-white bg-black/50 px-2 py-1 rounded-full sm:hidden">
                      Swipe to navigate
                    </div>
                  )}
                </div>
                
                {/* Image Indicators */}
                {images.length > 1 && (
                  <div className="flex justify-center gap-2">
                    {images.map((_, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => setCurrentImageIndex(index)}
                        className={`w-2 h-2 rounded-full transition-colors ${
                          index === currentImageIndex 
                            ? 'bg-[#EC5914]' 
                            : 'bg-[color:var(--brand-200)]'
                        }`}
                      />
                    ))}
                  </div>
                )}
                
                {/* Thumbnail Strip */}
                <div className="flex gap-2 justify-center">
                  {images.map((image, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setCurrentImageIndex(index)}
                      className={`relative w-12 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                        index === currentImageIndex 
                          ? 'border-[#EC5914] scale-110' 
                          : 'border-[color:var(--brand-200)] hover:border-[color:var(--brand-300)]'
                      }`}
                    >
                      <Image
                        src={URL.createObjectURL(image)}
                        alt={`Thumbnail ${index + 1}`}
                        fill
                        className="object-cover"
                        sizes="48px"
                        draggable={false}
                      />
                    </button>
                  ))}
                  
                  {/* Add More Images Button */}
                  {images.length < 3 && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-12 h-12 rounded-lg border-2 border-dashed border-[color:var(--brand-300)] bg-gray-50 flex items-center justify-center text-[color:var(--brand-600)] hover:border-[color:var(--brand-400)] transition-colors"
                    >
                      <span className="text-lg">+</span>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              /* Empty State - Add First Image */
              <div className="h-32 rounded-lg border-2 border-dashed border-[color:var(--brand-300)] bg-gray-50 flex flex-col items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center gap-2 text-[color:var(--brand-600)] hover:text-[color:var(--brand-700)] transition-colors"
                >
                  <span className="text-2xl">📷</span>
                  <span className="text-sm font-medium">Add photos</span>
                  <span className="text-xs text-gray-500">Up to 3 images</span>
                </button>
              </div>
            )}
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageSelect}
              className="hidden"
            />
          </div>
        </div>
        
        <div className="flex justify-between items-center">
          <div className="text-xs text-gray-500" />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setTitle("");
                setContent("");
                setImages([]);
                onCancel?.();
              }}
              className="px-3 py-2 rounded-lg border border-[color:var(--brand-200)] bg-white text-sm"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim() || isSubmitting}
              className="px-3 py-2 rounded-lg text-white soft-shadow text-sm disabled:opacity-50"
              style={{ backgroundColor: "#EC5914" }}
            >
              {isSubmitting ? "Posting..." : "Post"}
            </button>
          </div>
        </div>
      </form>
        </section>
      </div>
    </div>
  );
}
