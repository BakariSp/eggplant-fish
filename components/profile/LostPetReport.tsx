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
  onLostModeChange?: (newLostMode: boolean) => void; // 新增：状态变化回调
};

export default function LostPetReport({ pet, owner, onToggleLostMode, onLostModeChange }: Props) {
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
      // Check if user is the owner
      const supabase = getBrowserSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();
      const currentUserId = session?.user?.id;
      
      // Check if current user is the owner
      const { data: petData } = await supabase
        .from("pets")
        .select("owner_user_id")
        .eq("id", pet.id)
        .maybeSingle();
      
      const isOwner = !!currentUserId && !!petData?.owner_user_id && currentUserId === petData.owner_user_id;
      
      console.log('🔍 Auth check:', {
        currentUserId,
        petOwnerId: petData?.owner_user_id,
        isOwner,
        hasSession: !!session,
        hasAccessToken: !!session?.access_token
      });
      
      if (isOwner) {
        // Owner: Use status API with authentication
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        
        // Add authorization header if available
        if (session?.access_token) {
          headers['Authorization'] = `Bearer ${session.access_token}`;
          console.log('🔑 Added auth header');
        } else {
          console.warn('⚠️ No access token available');
        }
        
        console.log('📡 Making API call to /status with owner auth');
        const response = await fetch(`/api/pets/${pet.id}/status`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({
            status: newLostMode ? 'lost' : 'found'
          })
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('API Error:', response.status, response.statusText, errorText);
          throw new Error(`Failed to update status via API: ${response.status} ${errorText}`);
        }
        
        const result = await response.json();
        console.log('Owner status update:', result);
        
      } else {
        // Non-owner: Use report API (no authentication required)
        console.log('👤 Non-owner detected, using report API');
        if (newLostMode) {
          // Report as lost
          console.log('📡 Making API call to /report-lost');
          const response = await fetch(`/api/pets/${pet.id}/report-lost`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              reporter_name: session?.user?.user_metadata?.full_name || 'Anonymous',
              reporter_email: session?.user?.email || undefined,
              message: 'Reported via public profile'
            })
          });
          
          if (!response.ok) {
            throw new Error('Failed to report as lost');
          }
          
        } else {
          // Report as found
          console.log('📡 Making API call to /report-found');
          const response = await fetch(`/api/pets/${pet.id}/report-found`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              finder_name: session?.user?.user_metadata?.full_name || 'Anonymous',
              finder_email: session?.user?.email || undefined,
              message: 'Reported via public profile'
            })
          });
          
          if (!response.ok) {
            throw new Error('Failed to report as found');
          }
        }
        
        console.log(`Non-owner ${newLostMode ? 'lost' : 'found'} report sent`);
      }
      
      // Update local state
      setCurrentLostMode(newLostMode);
      
      // Call callbacks
      if (onToggleLostMode) {
        onToggleLostMode();
      }
      
      if (onLostModeChange) {
        onLostModeChange(newLostMode);
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
              <p className="text-lg mb-1">{pet.name || "Pet"}&apos;s Mom</p>
            </>
          ) : (
            <>
              <p className="text-lg mb-1">Please Contact {pet.name || "Pet"}&apos;s Mom</p>
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
          <button 
            className="px-8 py-3 rounded-full font-medium text-lg transition-colors shadow-lg bg-red-800 hover:bg-red-900 text-white"
            onClick={handleToggleLostMode}
            disabled={isUpdating}
          >
            {isUpdating ? "Updating..." : "Report found"}
          </button>
        ) : (
          // Placeholder space to maintain consistent background size
          <div className="h-12"></div>
        )}
      </div>
    </div>
  );
}
