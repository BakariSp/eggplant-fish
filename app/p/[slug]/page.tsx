import { getServerSupabaseClient, getAdminSupabaseClient } from "@/lib/supabase";
import PetHero from "@/components/profile/PetHero";
import PetInfoGrid from "@/components/profile/PetInfoGrid";
import RecentPosts from "@/components/profile/RecentPosts";
import PostLibrary from "@/components/profile/PostLibrary";
import OwnerInfo from "@/components/profile/OwnerInfo";

// Force dynamic rendering to prevent caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function PublicProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await getServerSupabaseClient();
  
  // Fetch pet data
  const { data: pet, error } = await supabase
    .from("pets")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  
  console.log("Public profile - Pet data loaded:", { 
    slug, 
    pet: pet ? {
      id: pet.id, 
      name: pet.name, 
      breed: pet.breed,
      vaccinated: pet.vaccinated,
      allergy_note: pet.allergy_note,
      birthdate: pet.birthdate,
      avatar_url: pet.avatar_url,
      lost_mode: pet.lost_mode
    } : null, 
    error 
  });

  // Fetch posts
  const { data: posts } = await supabase
    .from("pet_posts")
    .select("*")
    .eq("pet_id", pet?.id)
    .order("created_at", { ascending: false })
    .limit(10);

  // Fetch owner info and contact preferences
  let ownerInfo = null;
  if (pet) {
    const { data: contactPrefs, error: contactError } = await supabase
      .from("contact_prefs")
      .select("*")
      .eq("pet_id", pet.id)
      .single();

    console.log("Contact preferences loaded:", { contactPrefs, contactError });

    // Get user info from auth.users using admin client
    const adminSupabase = getAdminSupabaseClient();
    const { data: { user }, error: userError } = await adminSupabase.auth.admin.getUserById(pet.owner_user_id);
    
    console.log("User info loaded:", { 
      user: user ? {
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name,
        avatar_url: user.user_metadata?.avatar_url
      } : null, 
      userError 
    });
    
    ownerInfo = {
      name: user?.user_metadata?.full_name || user?.email?.split('@')[0] || "Pet Owner",
      phone: contactPrefs?.show_phone ? contactPrefs.phone : undefined,
      email: contactPrefs?.show_email ? contactPrefs.email : undefined,
      photo_url: user?.user_metadata?.avatar_url || user?.user_metadata?.picture
    };
    
    console.log("Final owner info:", ownerInfo);
  }

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
    microchip_id: "077077", // Mock data - TODO: add to schema
    allergies: pet.allergy_note ? pet.allergy_note.split(",").map((s: string) => s.trim()) : [],
    neuter_status: true, // Mock data - TODO: add to schema
  };
  
  console.log("Pet info processed:", petInfo);

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
        <PetHero pet={petData} tags={tags} petId={pet.id} />
        <PetInfoGrid info={petInfo} />
        {ownerInfo && <OwnerInfo owner={ownerInfo} />}
        <RecentPosts posts={posts || []} />
        <PostLibrary posts={posts || []} />
      </div>
    </main>
  );
}


