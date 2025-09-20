"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useCallback, useEffect, useRef } from "react";

type Pet = {
	name: string;
	breed: string;
	age?: string;
	avatar_url?: string | string[];
	lost_mode?: boolean;
};

type Props = {
	pet: Pet;
	tags?: string[];
	gender?: "male" | "female" | "unknown";
	images?: string[];
	petId?: string;
	onToggleLostFound?: () => void;
	showLostFound?: boolean; // 新增：是否显示Lost/Found界面
	showLostButton?: boolean; // 新增：是否显示右上角 Lost 按钮
};

export default function PetHero({ pet, tags = [], gender, images, petId, onToggleLostFound, showLostFound, showLostButton = true }: Props) {
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Handle avatar_url as either string or array, filter out empty values
  const getValidAvatarUrls = () => {
    if (images && images.length > 0) {
      return images.filter(url => url && url.trim() !== "");
    }
    
    if (pet.avatar_url) {
      if (Array.isArray(pet.avatar_url)) {
        const validUrls = pet.avatar_url.filter(url => url && url.trim() !== "");
        return validUrls.length > 0 ? validUrls : ["/dog.png"];
      } else if (typeof pet.avatar_url === 'string' && pet.avatar_url.trim() !== "") {
        return [pet.avatar_url];
      }
    }
    
    return ["/dog.png"];
  };
  
  const gallery = getValidAvatarUrls();
  const [index, setIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const imageContainerRef = useRef<HTMLDivElement>(null);

  const handlePrev = () => setIndex((i) => (i - 1 + gallery.length) % gallery.length);
  const handleNext = () => setIndex((i) => (i + 1) % gallery.length);

  // Handle Lost button click - show confirmation modal first
  const handleLostClick = () => {
    setShowConfirmModal(true);
  };

  // Handle confirmation
  const [isUpdating, setIsUpdating] = useState(false);
  const handleConfirmLost = async () => {
    if (isUpdating) return;
    setIsUpdating(true);
    setShowConfirmModal(false);
    // Optimistically show wrapper immediately
    onToggleLostFound?.();
    // Persist to DB
    try {
      if (petId) {
        const resp = await fetch(`/api/pets/${petId}/toggle-lost`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lost_mode: true }),
        });
        if (!resp.ok) {
          console.error('Failed to update lost mode');
        }
      }
    } catch (e) {
      console.error('Error updating lost mode', e);
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle cancel
  const handleCancelLost = () => {
    setShowConfirmModal(false);
  };

  // Touch/Mouse handlers for swipe gestures
  const handleStart = useCallback((clientX: number) => {
    if (gallery.length <= 1) return;
    setIsDragging(true);
    setDragStartX(clientX);
    setDragOffset(0);
  }, [gallery.length]);

  const handleMove = useCallback((clientX: number) => {
    if (!isDragging || gallery.length <= 1) return;
    const offset = clientX - dragStartX;
    setDragOffset(offset);
  }, [isDragging, dragStartX, gallery.length]);

  const handleEnd = useCallback(() => {
    if (!isDragging || gallery.length <= 1) return;
    
    const threshold = 50; // Minimum swipe distance
    
    if (Math.abs(dragOffset) > threshold) {
      if (dragOffset > 0) {
        // Swipe right - previous image
        handlePrev();
      } else {
        // Swipe left - next image
        handleNext();
      }
    }
    
    setIsDragging(false);
    setDragOffset(0);
  }, [isDragging, dragOffset, handlePrev, handleNext]);

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

  // Mouse events
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    handleStart(e.clientX);
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
  return (
    <div className="relative">
      {/* Hero Image with slider dots */}
      <div 
        ref={imageContainerRef}
        className="relative h-[300px] sm:h-[360px] rounded-[28px] overflow-hidden bg-[color:var(--brand-100)] select-none"
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ 
          cursor: gallery.length > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
          touchAction: 'pan-y pinch-zoom' 
        }}
      >
        <div
          className="flex h-full transition-transform duration-300 ease-out"
          style={{
            transform: `translateX(${-index * 100 + (isDragging ? (dragOffset / (imageContainerRef.current?.offsetWidth || 300)) * 100 : 0)}%)`,
          }}
        >
          {gallery.map((src, i) => (
            <div key={i} className="relative h-full flex-shrink-0" style={{ width: '100%' }}>
              <Image 
                src={src} 
                alt={`${pet.name} ${i + 1}`} 
                fill 
                className="object-cover" 
                priority={i === 0}
                draggable={false}
              />
            </div>
          ))}
        </div>
        
        {/* Lost Button - Top Right */}
        {/* 可通过 showLostButton 控制显示；当Lost/Found界面打开且是Lost状态时也隐藏按钮 */}
        {showLostButton && !(showLostFound && pet.lost_mode) && (
          <button
            onClick={handleLostClick}
            disabled={isUpdating}
            className="absolute top-4 right-4 px-4 py-2 rounded-full text-sm font-medium shadow-lg z-20 transition-opacity disabled:opacity-50"
            style={{ color: "var(--brand-800)", backgroundColor: "var(--background)" }}
          >
            {isUpdating ? 'Updating...' : 'Lost'}
          </button>
        )}

        {/* Slider Controls */}
        {gallery.length > 1 && (
          <>
            <button 
              aria-label="Previous" 
              onClick={handlePrev} 
              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/30 text-white flex items-center justify-center opacity-0 sm:opacity-100 hover:bg-black/50 transition-all z-10"
            >
              ‹
            </button>
            <button 
              aria-label="Next" 
              onClick={handleNext} 
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/30 text-white flex items-center justify-center opacity-0 sm:opacity-100 hover:bg-black/50 transition-all z-10"
            >
              ›
            </button>
          </>
        )}

        {/* Mobile Swipe Hint */}
        {/* {gallery.length > 1 && (
          <div className="absolute top-4 left-4 text-xs text-white bg-black/50 px-2 py-1 rounded-full sm:hidden">
            Swipe to navigate
          </div>
        )} */}

        {/* Gender + Tags Overlay (same stack for consistent spacing) */}
        <div className="absolute bottom-4 left-8 right-8 sm:left-10 sm:right-10">
          <div className="flex flex-col items-end gap-2">
            {gender && gender !== "unknown" && (
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center text-white shadow-lg text-xl font-extrabold"
                style={{ backgroundColor: "#EC5914" }}
                aria-label={gender === "female" ? "Female" : "Male"}
              >
                {gender === "female" ? "♀" : "♂"}
              </div>
            )}
            <div className="flex flex-wrap-reverse gap-2 justify-end ml-auto" style={{ maxWidth: "65%" }}>
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="px-4 py-1.5 rounded-full text-sm font-medium shadow-sm"
                  style={{ color: "var(--brand-800)", backgroundColor: "var(--background)" }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Pagination Dots */}
        {gallery.length > 1 && (
          <div className="absolute bottom-4 left-6 flex gap-2 z-10">
            {gallery.map((_, i) => (
              <button
                key={i}
                onClick={() => setIndex(i)}
                className={`w-2.5 h-2.5 rounded-full block transition-colors ${
                  i === index ? "bg-[#EC5914]" : "bg-white/90 hover:bg-white"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Pet Name & Info */}
      <div className="flex items-center justify-between mt-4 mb-6 px-6 sm:px-8">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-black" style={{ color: "#000", fontFamily: "var(--font-display), var(--font-quicksand), Arial" }}>
              {pet.name}
            </h1>
            <span className="text-black">🐕</span>
          </div>
          <div className="flex items-center gap-2 text-base text-black mt-1">
            <span>{pet.breed}</span>
            <span>•</span>
            <span>{pet.age || "0m"}</span>
          </div>
        </div>
        {/* Edit Button */}
        {petId ? (
          <Link
            href={`/dashboard/pets/${petId}/edit`}
            className="px-4 py-2 rounded-full text-white text-sm font-medium inline-block"
            style={{ backgroundColor: "#EC5914" }}
          >
            + Edit
          </Link>
        ) : (
          <button
            className="px-4 py-2 rounded-full text-white text-sm font-medium"
            style={{ backgroundColor: "#EC5914" }}
          >
            + Edit
          </button>
        )}
      </div>

      {/* Lost Confirmation Modal */}
      {showConfirmModal && (
        <div 
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={handleCancelLost}
        >
          <div 
            className="bg-[#f5f5dc] rounded-2xl max-w-md w-full p-6 shadow-2xl transform transition-all duration-300 scale-100"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Icon */}
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
            </div>

            {/* Title */}
            <h3 className="text-xl font-semibold text-gray-900 text-center mb-2">
              Report Lost Pet
            </h3>

            {/* Message */}
            <p className="text-gray-600 text-center mb-6">
              This will send an email and a message to the owner, would you like to continue?
            </p>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleCancelLost}
                className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmLost}
                className="flex-1 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
