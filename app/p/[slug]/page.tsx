import { getServerSupabaseClient } from "@/lib/supabase";
import PetHero from "@/components/profile/PetHero";
import PetInfoGrid from "@/components/profile/PetInfoGrid";
import RecentPosts from "@/components/profile/RecentPosts";
import PostLibrary from "@/components/profile/PostLibrary";

export default async function PublicProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await getServerSupabaseClient();
  
  // Fetch pet data
  const { data: pet } = await supabase
    .from("pets")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  // Fetch posts
  const { data: posts } = await supabase
    .from("pet_posts")
    .select("*")
    .eq("pet_id", pet?.id)
    .order("created_at", { ascending: false })
    .limit(10);

  if (!pet) {
    return (
      <main className="p-4 text-center">
        <h1 className="text-xl font-semibold text-gray-600">Pet not found</h1>
        <p className="text-sm text-gray-500 mt-2">The pet profile &quot;{slug}&quot; doesn&apos;t exist.</p>
      </main>
    );
  }

  // Calculate age
  const age = pet.birthdate 
    ? (() => {
        const birth = new Date(pet.birthdate);
        const now = new Date();
        const years = now.getFullYear() - birth.getFullYear();
        const months = now.getMonth() - birth.getMonth();
        return years > 0 ? `${years}y ${months}m` : `${months}m`;
      })()
    : undefined;

  const petData = {
    name: pet.name || "Unknown",
    breed: pet.breed || "Mixed",
    age,
    avatar_url: pet.avatar_url,
    lost_mode: pet.lost_mode,
  };

  const petInfo = {
    vaccinated: pet.vaccinated,
    vaccinations: pet.vaccinated ? ["Rabies", "DHPP / DAPP"] : [],
    microchip_id: "077077", // Mock data
    allergies: pet.allergy_note ? pet.allergy_note.split(",").map((s: string) => s.trim()) : ["Wheat", "Dust mites"],
    neuter_status: true, // Mock data
  };

  const tags = ["Active", "Leash trained", "Tries to eat things", "Friendly with cats"];

  return (
    <main className="min-h-screen">
      {/* Header */}
      <header className="px-4 pt-4 pb-2 sticky top-0 z-10" style={{ background: "#FCEFDC" }}>
        <div className="text-lg font-extrabold tracking-wide" style={{ color: "#2B1F1B" }}>
          EGGPLANT.FISH
        </div>
        <div className="hairline mt-2" />
      </header>

      {/* Content */}
      <div className="px-3 sm:px-4 py-6 max-w-[760px] mx-auto">
        <PetHero pet={petData} tags={tags} />
        <PetInfoGrid info={petInfo} />
        <RecentPosts posts={posts || []} />
        <PostLibrary posts={posts || []} />
      </div>
    </main>
  );
}


