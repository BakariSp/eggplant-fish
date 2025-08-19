import EditProfileClient from "./edit-client";
import Container from "@/components/layout/Container";

export default async function EditProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <main className="p-4 min-h-screen" style={{ backgroundColor: "#FAEEDA" }}>
      <Container>
        <EditProfileClient petId={id} />
      </Container>
    </main>
  );
}
