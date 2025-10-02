import EditProfileClient from "./edit-client";
import Container from "@/components/layout/Container";
import { getServerSupabaseClient } from "@/lib/supabase";

export default async function EditProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; // treat as tag_code first; fallback to uuid id
  const supabase = await getServerSupabaseClient();
  
  // Prefer tag_code; fallback to uuid id
  let { data: pet } = await supabase
    .from("pets")
    .select("id")
    .eq("tag_code", id)
    .maybeSingle();
  if (!pet) {
    const fb = await supabase
      .from("pets")
      .select("id")
      .eq("id", id)
      .maybeSingle();
    pet = fb.data as any;
  }

  if (!pet) {
    return (
      <main className="p-4 min-h-screen" style={{ backgroundColor: "#FAEEDA" }}>
        <Container>
          <div className="text-center py-16 text-gray-600">Pet not found</div>
        </Container>
      </main>
    );
  }

  return (
    <main className="p-4 min-h-screen" style={{ backgroundColor: "#FAEEDA" }}>
      <Container>
        <EditProfileClient petId={pet.id} />
      </Container>
    </main>
  );
}
