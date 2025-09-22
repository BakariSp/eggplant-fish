import { getServerSupabaseClient, getAdminSupabaseClient } from "@/lib/supabase";
import PostsLostClient from "@/app/dashboard/pets/[id]/posts/PostsLostClient";

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

  // Posts 列表交由 PostsClient 在客户端自行拉取，避免双实现

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


  return (
    <main className="min-h-screen">
      <PostsLostClient pet={pet} ownerInfo={ownerInfo} />
    </main>
  );
}


