import PetHero from "./PetHero";
import PetInfoGrid from "./PetInfoGrid";

type Pet = {
  id: string;
  name?: string;
  breed?: string;
  birthdate?: string;
  avatar_url?: string | string[];
  lost_mode?: boolean;
  gender?: "male" | "female" | "unknown";
  vaccinated?: string[];
  allergy_note?: string[];
  microchip_id?: string;
  neuter_status?: boolean | null;
  traits?: string[];
  year?: number;
  month?: number;
};

type Props = {
  pet: Pet;
};

export default function PetProfileSection({ pet }: Props) {
  // Calculate age string priority: explicit year/month fields > birthdate > undefined
  const age = (typeof pet.year === 'number' || typeof pet.month === 'number')
    ? (() => {
        const y = pet.year ?? 0;
        const m = pet.month ?? 0;
        if (y > 0 && m > 0) return `${y}y ${m}m`;
        if (y > 0) return `${y}y`;
        return `${m}m`;
      })()
    : (pet.birthdate
      ? (() => {
          const birth = new Date(pet.birthdate);
          const now = new Date();
          let years = now.getFullYear() - birth.getFullYear();
          let months = now.getMonth() - birth.getMonth();
          if (months < 0) { years -= 1; months += 12; }
          return years > 0 ? `${years}y ${months}m` : `${months}m`;
        })()
      : undefined);

  const petData = {
    name: pet.name || "Unknown",
    breed: pet.breed || "Mixed",
    age,
    avatar_url: pet.avatar_url,
    lost_mode: pet.lost_mode,
  };

  const petInfo = {
    vaccinated: Array.isArray(pet.vaccinated) ? pet.vaccinated : [],
    vaccinations: undefined as string[] | undefined,
    microchip_id: pet.microchip_id ?? undefined,
    allergies: Array.isArray(pet.allergy_note) ? pet.allergy_note : [],
    neuter_status: pet.neuter_status ?? undefined,
  };
  
  const tags = Array.isArray(pet.traits) ? pet.traits.filter((t: unknown) => typeof t === 'string' && t.trim() !== '') : [];

  return (
    <>
      <PetHero 
        pet={petData} 
        tags={tags} 
        petId={pet.id} 
        gender={(pet.gender === 'male' || pet.gender === 'female' || pet.gender === 'unknown') ? pet.gender : 'unknown'}
      />
      <PetInfoGrid info={petInfo} />
    </>
  );
}
