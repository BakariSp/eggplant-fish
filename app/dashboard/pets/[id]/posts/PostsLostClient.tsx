"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getBrowserSupabaseClient } from "@/lib/supabase-browser";
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

type Props = {
	pet: Pet;
	ownerInfo: Owner;
	emergencyInfo?: Emergency;
	isPublic?: boolean; // legacy, will be overridden by canEdit
	ownerUserId?: string;
	ownerAuthEmail?: string;
	slug?: string;
	initialCanEdit?: boolean;
};

export default function PostsLostClient({ pet, ownerInfo, emergencyInfo, isPublic = false, ownerUserId, ownerAuthEmail, slug, initialCanEdit = false }: Props) {
	// 同步 /p 页面逻辑：用本地状态控制 Lost/Found 的展示与动画
	const [showLostFound, setShowLostFound] = useState(pet.lost_mode === true);
	const [petLostMode, setPetLostMode] = useState<boolean>(pet.lost_mode ?? false);
	const [canEdit, setCanEdit] = useState<boolean>(initialCanEdit);
    const router = useRouter();
    const pathname = usePathname();

	useEffect(() => {
		let cancelled = false;
		(async () => {
			try {
				const supabase = getBrowserSupabaseClient();
				const { data: { session } } = await supabase.auth.getSession();
				const sid = session?.user?.id || "";
				const semail = (session?.user?.email || "").trim().toLowerCase();
				const ownerId = ownerUserId || "";
				const ownerEmail = (ownerAuthEmail || "").trim().toLowerCase();

				const idMismatch = !!sid && !!ownerId && sid !== ownerId;
				const emailMismatch = !!semail && !!ownerEmail && semail !== ownerEmail;

                if (idMismatch || emailMismatch) {
                    // 明确非主人 → 替换到公开页，避免重定向到相同路径导致循环
                    const target = slug ? `/p/${slug}` : "";
                    if (!cancelled && target && pathname !== target) {
                        router.replace(target);
                    }
					return;
				}
				// 能证明是主人（id 或 email 任何一项匹配）则开放编辑
				const idMatch = !!sid && !!ownerId && sid === ownerId;
				const emailMatch = !!semail && !!ownerEmail && semail === ownerEmail;
				if ((idMatch || emailMatch) && !cancelled) setCanEdit(true);
			} catch {
				// 忽略客户端会话错误，保持 canEdit 现状
			}
		})();
		return () => { cancelled = true; };
	}, [ownerUserId, ownerAuthEmail, slug]);

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
				isPublic={!canEdit}
			/>
			<PostsClient petId={pet.id} ownerInfo={ownerInfo ?? undefined} emergencyInfo={emergencyInfo} isPublic={!canEdit} />
		</div>
	);
}


