"use client";

import { useState } from "react";
import PetProfileSection from "./PetProfileSection";
import RecentPostsWrapper from "./RecentPostsWrapper";
import OwnerInfo from "./OwnerInfo";
import LostPetReportWrapper from "./LostPetReportWrapper";

type Pet = {
  id: string;
  name?: string;
  breed?: string;
  birthdate?: string;
  avatar_url?: string | string[];
  vaccinated?: boolean;
  allergy_note?: string;
  lost_mode?: boolean;
  gender?: string;
  microchip_id?: string;
  neuter_status?: boolean;
  year?: number;
  month?: number;
  traits?: string[];
};

type Owner = {
  name?: string;
  phone?: string;
  email?: string;
  photo_url?: string;
};

type Post = {
  id: string;
  content: string;
  images?: string[];
  created_at: string;
};

type Props = {
  pet: Pet;
  posts: Post[];
  ownerInfo: Owner | null;
};

export default function PublicProfileClient({ pet, posts, ownerInfo }: Props) {
  // 基于宠物的lost_mode状态来决定是否显示Lost/Found界面
  const [showLostFound, setShowLostFound] = useState(pet.lost_mode === true);
  // 本地状态管理宠物的lost_mode
  const [petLostMode, setPetLostMode] = useState(pet.lost_mode || false);

  const handleToggleLostFound = () => {
    // 点击时始终显示Lost/Found并标记为Lost，避免误触导致隐藏
    setShowLostFound(true);
    setPetLostMode(true);
  };

  // 处理LostPetReport内部状态变化的回调
  const handleLostModeChange = (newLostMode: boolean) => {
    setPetLostMode(newLostMode);
    // 如果变成Found状态，立即开始隐藏动画
    if (!newLostMode) {
      setShowLostFound(false);
    }
  };

  // 创建更新后的pet对象，包含最新的lost_mode状态
  const updatedPet = {
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
      />
      <RecentPostsWrapper posts={posts || []} petId={pet.id} />
      {ownerInfo && <OwnerInfo owner={ownerInfo} />}
    </div>
  );
}
