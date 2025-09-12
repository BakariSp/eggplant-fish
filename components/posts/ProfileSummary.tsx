import PetHero from "@/components/profile/PetHero";
import PetInfoGrid from "@/components/profile/PetInfoGrid";

type Profile = {
	pet_id?: string;
	name?: string;
	breed?: string;
	birthdate?: string;
	vaccinated?: boolean;
	vaccinations?: string[];
	allergies?: string[];
	microchip_id?: string;
	neuter_status?: boolean;
	gender?: "male" | "female";
	traits?: string[];
	avatar_url?: string | string[];
};

type Props = {
	profile: Profile | null;
	loading?: boolean;
};

function formatAge(birthdate?: string): string | undefined {
	if (!birthdate) return undefined;
	const birth = new Date(birthdate);
	if (Number.isNaN(birth.getTime())) return undefined;
	const now = new Date();
	let years = now.getFullYear() - birth.getFullYear();
	let months = now.getMonth() - birth.getMonth();
	if (months < 0) {
		years -= 1;
		months += 12;
	}
	return `${years}y ${months}m`;
}

export default function ProfileSummary({ profile, loading }: Props) {
	if (loading) {
		return (
			<section>
				<div className="h-64 rounded-2xl bg-gray-100 mb-4" />
				<div className="grid grid-cols-2 md:grid-cols-4 gap-2">
					{[1, 2, 3, 4].map((i) => (
						<div key={i} className="rounded-xl border border-[color:var(--brand-200)] p-4 bg-gray-50">
							<div className="h-3 w-16 bg-gray-200 rounded mb-2" />
							<div className="h-4 w-24 bg-gray-200 rounded" />
						</div>
					))}
				</div>
			</section>
		);
	}

	const name = profile?.name || "Your Pet";
	const breed = profile?.breed || "Unknown breed";
	const age = formatAge(profile?.birthdate);
	const tags = (profile?.traits || []).slice(0, 6);

	return (
		<section>
			<PetHero
				pet={{ name, breed, age, avatar_url: profile?.avatar_url }}
				tags={tags}
				gender={profile?.gender}
				petId={profile?.pet_id}
			/>

			<PetInfoGrid
				info={{
					vaccinated: profile?.vaccinated,
					vaccinations: profile?.vaccinations,
					microchip_id: profile?.microchip_id,
					allergies: profile?.allergies,
					neuter_status: profile?.neuter_status,
				}}
			/>
		</section>
	);
}
