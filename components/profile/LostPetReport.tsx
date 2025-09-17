"use client";

import Image from "next/image";
import { useState } from "react";
import { getBrowserSupabaseClient } from "@/lib/supabase-browser";

type Pet = {
  id: string;
  name?: string;
  avatar_url?: string | string[];
  lost_mode?: boolean;
  lost_since?: string;
};

type Owner = {
  name?: string;
  phone?: string;
  email?: string;
  photo_url?: string;
};

type Props = {
  pet: Pet;
  owner: Owner | null;
  onToggleLostMode?: () => void;
};

export default function LostPetReport({ pet, owner, onToggleLostMode }: Props) {
  const petImage = Array.isArray(pet.avatar_url) ? pet.avatar_url[0] : pet.avatar_url;
  const ownerName = owner?.name || "Pet Owner";
  const [currentLostMode, setCurrentLostMode] = useState(pet.lost_mode);
  const [isUpdating, setIsUpdating] = useState(false);
  const isLost = currentLostMode;

  const handleToggleLostMode = async () => {
    if (isUpdating) return;
    
    setIsUpdating(true);
    const newLostMode = !currentLostMode;
    
    try {
      const supabase = getBrowserSupabaseClient();
      
      const updateData: any = {
        lost_mode: newLostMode
      };
      
      // If setting to lost (true), update lost_since to current timestamp
      if (newLostMode) {
        updateData.lost_since = new Date().toISOString();
      }
      
      const { error } = await supabase
        .from("pets")
        .update(updateData)
        .eq("id", pet.id);
      
      if (error) {
        console.error("Failed to update lost mode:", error);
        alert("Failed to update pet status. Please try again.");
      } else {
        setCurrentLostMode(newLostMode);
        console.log(`Pet ${pet.name} lost mode updated to: ${newLostMode}`);
        
        // Call the optional callback if provided
        if (onToggleLostMode) {
          onToggleLostMode();
        }
      }
    } catch (error) {
      console.error("Error updating lost mode:", error);
      alert("An error occurred. Please try again.");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div 
      className="relative mb-2"
      style={{
        background: isLost 
          ? "linear-gradient(to bottom, #FCEFDC, #9E3E10, #FCEFDC)" 
          : "linear-gradient(to bottom, #FCEFDC, #49935A, #FCEFDC)"
      }}
    >      
      {/* Content */}
      <div className="text-center p-6">
        {/* Status banner */}
        <div className="flex items-center justify-center mb-4">
          {isLost ? (
            <button 
              onClick={handleToggleLostMode}
              disabled={isUpdating}
              className={`bg-red-800 px-6 py-2 rounded-full flex items-center gap-3 hover:bg-red-900 transition-colors ${
                isUpdating ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                <span className="text-red-800 text-sm font-bold">i</span>
              </div>
              <span className="text-white font-bold text-lg">
                {isUpdating ? "Updating..." : "Lost"}
              </span>
            </button>
          ) : (
            <button 
              onClick={handleToggleLostMode}
              disabled={isUpdating}
              className={`px-6 py-2 rounded-full flex items-center gap-3 hover:opacity-90 transition-opacity ${
                isUpdating ? "opacity-50 cursor-not-allowed" : ""
              }`}
              style={{ backgroundColor: "#603338" }}
            >
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-white font-bold text-lg">
                {isUpdating ? "Updating..." : "Founded"}
              </span>
            </button>
          )}
        </div>

        {/* Report message */}
        <div className="text-white mb-6">
          {isLost ? (
            <>
              <p className="text-lg mb-1">Please Report A Found To</p>
              <p className="text-lg mb-1">{pet.name || "Pet"}'s Mom</p>
            </>
          ) : (
            <>
              <p className="text-lg mb-1">Please Contact {pet.name || "Pet"}'s Mom</p>
              <div className="text-lg mb-1">&nbsp;</div>
            </>
          )}
        </div>

        {/* Owner profile picture */}
        <div className="flex justify-center mb-4">
          <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-lg">
            {owner?.photo_url ? (
              <Image
                src={owner.photo_url}
                alt={ownerName}
                width={96}
                height={96}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                <span className="text-2xl">👤</span>
              </div>
            )}
          </div>
        </div>

        {/* Owner name */}
        <p className="text-white text-lg font-medium mb-6">{ownerName}</p>

        {/* Contact buttons */}
        <div className="flex justify-center gap-4 mb-6">
          {/* SMS Button */}
          <a 
            href={owner?.phone ? `sms:${owner.phone}` : "#"}
            className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow"
          >
            <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </a>
          {/* Phone Call Button */}
          <a 
            href={owner?.phone ? `tel:${owner.phone}` : "#"}
            className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow"
          >
            <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          </a>
        </div>

        {/* Action button - only show for Lost pets */}
        {isLost ? (
          <button className="px-8 py-3 rounded-full font-medium text-lg transition-colors shadow-lg bg-red-800 hover:bg-red-900 text-white">
            Report found
          </button>
        ) : (
          // Placeholder space to maintain consistent background size
          <div className="h-12"></div>
        )}
      </div>
    </div>
  );
}
