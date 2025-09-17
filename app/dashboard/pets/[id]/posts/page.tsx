import { getServerSupabaseClient, getAdminSupabaseClient } from "@/lib/supabase";
import PetProfileSection from "@/components/profile/PetProfileSection";
import PostsClient from "./posts-client";

// Force dynamic rendering to prevent caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function PetPostsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await getServerSupabaseClient();
  
  // Fetch pet data directly from database (same as public profile page)
  const { data: pet, error } = await supabase
    .from("pets")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  
  console.log("Posts page - Pet data loaded:", { 
    id, 
    pet: pet ? {
      id: pet.id, 
      name: pet.name, 
      breed: pet.breed,
      vaccinated: pet.vaccinated,
      allergy_note: pet.allergy_note,
      birthdate: pet.birthdate,
      avatar_url: pet.avatar_url,
      lost_mode: pet.lost_mode,
      gender: pet.gender,
      traits: pet.traits,
      microchip_id: pet.microchip_id,
      neuter_status: pet.neuter_status,
      year: pet.year,
      month: pet.month
    } : null, 
    error 
  });

  // Fetch owner info and contact preferences (same as public profile page)
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
      <main className="min-h-screen">
        <div className="px-3 sm:px-4 pt-1 pb-6 max-w-[760px] mx-auto">
          <div className="text-center py-8">
            <p className="text-gray-500">Pet not found</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      <div className="px-3 sm:px-4 pt-1 pb-6 max-w-[760px] mx-auto">
        <PetProfileSection pet={pet} />
        <PostsClient petId={id} ownerInfo={ownerInfo} />
      </div>
    </main>
  );
}


