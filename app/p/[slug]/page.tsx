import { getServerSupabaseClient } from "@/lib/supabase";

export default async function PublicProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = getServerSupabaseClient();
  const { data: pet } = await supabase
    .from("pets")
    .select(
      "id, name, breed, birthdate, avatar_url, vaccinated, allergy_note, lost_mode, lost_message, contact_prefs:contact_prefs(*)"
    )
    .eq("slug", slug)
    .maybeSingle();

  return (
    <main className="p-4">
      <h1 className="text-xl font-semibold">Pet Profile</h1>
      <pre className="mt-4 text-sm bg-gray-50 p-3 rounded border overflow-auto">
        {JSON.stringify({ slug, pet }, null, 2)}
      </pre>
    </main>
  );
}


