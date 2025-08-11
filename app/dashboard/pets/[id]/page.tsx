export default async function PetDashboardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <main className="p-4">
      <h1 className="text-xl font-semibold">Edit Pet</h1>
      <p className="text-sm text-gray-600">Pet ID: {id}</p>
    </main>
  );
}


