"use client";

import { useState } from "react";
import LostPetReportWrapper from "@/components/profile/LostPetReportWrapper";
import PetProfileSection from "@/components/profile/PetProfileSection";
import PostsClient from "./posts-client";

type Pet = {
  id: string;
  name?: string;
  breed?: string;
  birthdate?: string;
  avatar_url?: string | string[];
  vaccinated?: boolean | string[];
  allergy_note?: string | string[];
  lost_mode?: boolean;
  gender?: string;
  microchip_id?: string;
  neuter_status?: boolean | null;
  year?: number;
  month?: number;
  traits?: string[];
};

type Owner = {
  name?: string;
  phone?: string;
  email?: string;
  photo_url?: string;
} | null;

type Emergency = {
  vet?: { name?: string; phone?: string };
} | null;

export default function PostsLostClient({ pet, ownerInfo, emergencyInfo, isPublic = false }: { pet: Pet; ownerInfo: Owner; emergencyInfo?: Emergency; isPublic?: boolean }) {
  // 同步 /p 页面逻辑：用本地状态控制 Lost/Found 的展示与动画
  const [showLostFound, setShowLostFound] = useState(pet.lost_mode === true);
  const [petLostMode, setPetLostMode] = useState<boolean>(pet.lost_mode ?? false);

  const handleToggleLostFound = () => {
    // 主动打开 Lost/Found 面板并置为 Lost
    setShowLostFound(true);
    setPetLostMode(true);
  };

  const handleLostModeChange = (newLostMode: boolean) => {
    setPetLostMode(newLostMode);
    if (!newLostMode) {
      // Found 时触发隐藏动画
      setShowLostFound(false);
    }
  };

  const updatedPet: Pet = {
    ...pet,
    lost_mode: petLostMode
  };

  return (
    <div className="px-3 sm:px-4 pt-1 pb-6 max-w-[760px] mx-auto">
      <LostPetReportWrapper
        initialPet={updatedPet}
        owner={ownerInfo}
        showLostFound={showLostFound}
        onLostModeChange={handleLostModeChange}
      />
      <PetProfileSection
        pet={updatedPet}
        onToggleLostFound={handleToggleLostFound}
        showLostFound={showLostFound}
        isPublic={isPublic}
      />
      <PostsClient petId={pet.id} ownerInfo={ownerInfo ?? undefined} emergencyInfo={emergencyInfo} isPublic={isPublic} />
    </div>
  );
}


