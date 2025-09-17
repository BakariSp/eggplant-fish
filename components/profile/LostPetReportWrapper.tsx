"use client";

import { useRouter } from "next/navigation";
import LostPetReport from "./LostPetReport";

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
};

export default function LostPetReportWrapper({ initialPet, owner }: Props) {
  const router = useRouter();

  const handleRefresh = () => {
    // Refresh the page to get updated data from the server
    router.refresh();
  };

  return (
    <LostPetReport 
      pet={initialPet} 
      owner={owner} 
      onToggleLostMode={handleRefresh} 
    />
  );
}
