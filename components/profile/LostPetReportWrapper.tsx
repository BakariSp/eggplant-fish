"use client";

import { useRouter } from "next/navigation";
import LostFoundModule from "./LostFoundModule";

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
  initialPet: Pet;
  owner: Owner | null;
  showLostFound?: boolean; // 新增：控制是否显示 Lost/Found 功能
  onLostModeChange?: (newLostMode: boolean) => void; // 新增：状态变化回调
};

export default function LostPetReportWrapper({ 
  initialPet, 
  owner, 
  showLostFound = false, // 默认隐藏LostPetReportWrapper本身
  onLostModeChange
}: Props) {
  const router = useRouter();

  const handleRefresh = () => {
    // Refresh the page to get updated data from the server
    router.refresh();
  };

  return (
    <LostFoundModule 
      pet={initialPet} 
      owner={owner} 
      onToggleLostMode={handleRefresh}
      onLostModeChange={onLostModeChange}
      isVisible={showLostFound}
    />
  );
}
