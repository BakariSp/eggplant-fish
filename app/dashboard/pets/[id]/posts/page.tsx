import { getServerSupabaseClient, getAdminSupabaseClient } from "@/lib/supabase";
import PostsLostClient from "./PostsLostClient";
import { redirect } from "next/navigation";

// Force dynamic rendering to prevent caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function PetPostsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; // id can be tag_code or uuid
  const supabase = await getServerSupabaseClient();
  
  // 1) Resolve pet by tag_code first, fallback to id
  let { data: pet, error } = await supabase
    .from("pets")
    .select("*")
    .eq("tag_code", id)
    .maybeSingle();
  if (!pet) {
    const fb = await supabase
      .from("pets")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    pet = fb.data as typeof pet;
    error = fb.error as typeof error;
  }
  
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
      month: pet.month,
      owner_user_id: pet.owner_user_id
    } : null, 
    error 
  });

  // Not found → render simple UI
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

  // 2) Ownership gate (server): only block clearly non-owner by id; otherwise let client fix
  let initialCanEdit = false;
  let ownerAuthEmail: string | undefined = undefined;

  try {
    const { data: { session } } = await supabase.auth.getSession();
    const currentUserId = session?.user?.id || null;
    const ownerUserId = pet.owner_user_id || null;

    if (!!currentUserId && !!ownerUserId) {
      if (currentUserId !== ownerUserId) {
        // clearly not the owner by id → redirect to public
        redirect(`/p/${pet.tag_code || pet.id}`);
      } else {
        initialCanEdit = true;
      }
    }
  } catch {
    // ignore; client will re-check
  }

  // fetch owner auth email to help client fallback
  try {
    const adminSupabase = getAdminSupabaseClient();
    const { data: { user: ownerUser } } = await adminSupabase.auth.admin.getUserById(pet.owner_user_id);
    ownerAuthEmail = ownerUser?.email || undefined;
  } catch {}

  // 3) Load page data (public-safe fields)
  let ownerInfo = null;
  let emergencyInfo = null;
  {
    const { data: contactPrefs, error: contactError } = await supabase
      .from("contact_prefs")
      .select("*")
      .eq("pet_id", pet.id)
      .maybeSingle();

    console.log("Contact preferences loaded:", { contactPrefs, contactError });

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
    
    emergencyInfo = {
      vet: {
        name: contactPrefs?.other_link || "",
        phone: ""
      }
    };
    
    console.log("Final owner info:", ownerInfo);
    console.log("Emergency info:", emergencyInfo);
  }

  return (
    <main className="min-h-screen">
      <PostsLostClient
        pet={pet}
        ownerInfo={ownerInfo}
        emergencyInfo={emergencyInfo}
        ownerUserId={pet.owner_user_id}
        ownerAuthEmail={ownerAuthEmail}
        slug={pet.tag_code || pet.id}
        initialCanEdit={initialCanEdit}
      />
    </main>
  );
}


