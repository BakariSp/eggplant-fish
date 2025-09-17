import PetProfileSection from "@/components/profile/PetProfileSection";

type Profile = {
	pet_id?: string;
	name?: string;
	breed?: string;
	birthdate?: string;
	vaccinated?: boolean | string[];
	vaccinations?: string[];
	allergies?: string[];
	microchip_id?: string;
	neuter_status?: boolean | null;
	gender?: "male" | "female" | "unknown";
	traits?: string[];
	avatar_url?: string | string[];
	year?: number;
	month?: number;
};

type Props = {
	profile: Profile | null;
	loading?: boolean;
};

export default function ProfileSummary({ profile, loading }: Props) {
	console.log("ProfileSummary - loading:", loading, "profile:", profile);
	
	// Convert profile data to match PetProfileSection expected format
	const petData = {
		id: profile?.pet_id || "",
		name: profile?.name || "Unknown Pet",
		breed: profile?.breed || "Mixed",
		birthdate: profile?.birthdate,
		avatar_url: profile?.avatar_url,
		lost_mode: false, // Default for posts page
		gender: profile?.gender || "unknown",
		vaccinated: Array.isArray(profile?.vaccinations) ? profile.vaccinations : [], // Map vaccinations to vaccinated
		allergy_note: Array.isArray(profile?.allergies) ? profile.allergies : [],
		microchip_id: profile?.microchip_id,
		neuter_status: profile?.neuter_status,
		traits: profile?.traits || [],
		year: profile?.year,
		month: profile?.month,
	};

	console.log("ProfileSummary - converted petData:", petData);

	return (
		<section>
			<PetProfileSection pet={petData} />
		</section>
	);
}
