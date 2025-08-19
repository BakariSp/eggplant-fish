"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useCallback, useEffect, useRef } from "react";

type Pet = {
	name: string;
	breed: string;
	age?: string;
	avatar_url?: string;
	lost_mode?: boolean;
};

type Props = {
	pet: Pet;
	tags?: string[];
	gender?: "male" | "female";
	images?: string[];
	petId?: string;
};

export default function PetHero({ pet, tags = [], gender, images, petId }: Props) {
  const gallery = images && images.length > 0 ? images : [pet.avatar_url || "/dog.png", "/dog.png", "/dog.png"];
  const [index, setIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const imageContainerRef = useRef<HTMLDivElement>(null);

  const handlePrev = () => setIndex((i) => (i - 1 + gallery.length) % gallery.length);
  const handleNext = () => setIndex((i) => (i + 1) % gallery.length);

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
        className="relative h-[280px] sm:h-[320px] rounded-[28px] overflow-hidden bg-[color:var(--brand-100)] select-none"
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

        {/* Gender Badge */}
        <div className="absolute top-4 right-4">
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-white shadow-lg" style={{ backgroundColor: "#EC5914" }}>
            {gender === "female" ? "♀" : gender === "male" ? "♂" : "•"}
          </div>
        </div>

        {/* Tags Overlay */}
        <div className="absolute bottom-12 left-4 right-4">
          <div className="flex flex-wrap gap-2 justify-end">
            {tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 rounded-full text-xs font-medium bg-white/90 backdrop-blur-sm shadow-sm"
                style={{ color: "var(--brand-800)" }}
              >
                {tag}
              </span>
            ))}
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
      <div className="flex items-center justify-between mt-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-extrabold" style={{ color: "#000" }}>
              {pet.name}
            </h1>
            <span className="text-black">🐕</span>
          </div>
          <div className="flex items-center gap-2 text-base text-black mt-1">
            <span>{pet.breed}</span>
            <span>•</span>
            <span>{pet.age || "1y 4m"}</span>
          </div>
        </div>
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
    </div>
  );
}
