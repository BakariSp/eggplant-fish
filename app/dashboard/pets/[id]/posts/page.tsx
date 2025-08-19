import PostsClient from "./posts-client";
import Container from "@/components/layout/Container";
import Footer from "@/components/layout/Footer";

export default async function PetPostsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <>
      <main className="p-4">
        <Container>
          <PostsClient petId={id} />
        </Container>
      </main>
      <Footer />
    </>
  );
}


