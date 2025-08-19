import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getServerSupabaseClient } from "@/lib/supabase";

export default async function PetsListPage() {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect("/login");
  }

  const supabase = await getServerSupabaseClient();
  
  // Fetch user's pets
  const { data: pets } = await supabase
    .from("pets")
    .select("id, slug, name, breed, avatar_url, created_at")
    .eq("owner_user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Pets</h1>
            <p className="text-gray-600 mt-2">Manage your pet profiles and posts</p>
          </div>
          <Link
            href="/setup"
            className="bg-[#8f743c] text-white px-6 py-3 rounded-lg hover:bg-[#7d6635] transition-colors"
          >
            Add New Pet
          </Link>
        </div>

        {/* Pets Grid */}
        {pets && pets.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pets.map((pet) => (
              <div key={pet.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-square bg-gray-200 relative">
                  {pet.avatar_url ? (
                    <img
                      src={pet.avatar_url}
                      alt={pet.name || "Pet"}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M4.5 12.75a6 6 0 0 1 11.25-2.25H18a.75.75 0 0 1 .75.75v7.5a.75.75 0 0 1-.75.75h-1.5a.75.75 0 0 1-.75-.75v-4.5a3 3 0 1 0-6 0v4.5a.75.75 0 0 1-.75.75H7.5a.75.75 0 0 1-.75-.75v-7.5a.75.75 0 0 1 .75-.75h1.75Z" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-lg text-gray-900 mb-1">
                    {pet.name || "Unnamed Pet"}
                  </h3>
                  <p className="text-gray-600 text-sm mb-3">{pet.breed || "Mixed Breed"}</p>
                  <div className="flex gap-2">
                    <Link
                      href={`/dashboard/pets/${pet.id}/edit`}
                      className="flex-1 bg-gray-100 text-gray-700 px-3 py-2 rounded text-sm text-center hover:bg-gray-200 transition-colors"
                    >
                      Edit Profile
                    </Link>
                    <Link
                      href={`/dashboard/pets/${pet.id}/posts`}
                      className="flex-1 bg-[#8f743c] text-white px-3 py-2 rounded text-sm text-center hover:bg-[#7d6635] transition-colors"
                    >
                      Manage Posts
                    </Link>
                  </div>
                  <Link
                    href={`/p/${pet.slug}`}
                    className="block mt-2 text-center text-[#EC5914] text-sm hover:underline"
                  >
                    View Public Profile
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto mb-4 text-gray-300">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M4.5 12.75a6 6 0 0 1 11.25-2.25H18a.75.75 0 0 1 .75.75v7.5a.75.75 0 0 1-.75.75h-1.5a.75.75 0 0 1-.75-.75v-4.5a3 3 0 1 0-6 0v4.5a.75.75 0 0 1-.75.75H7.5a.75.75 0 0 1-.75-.75v-7.5a.75.75 0 0 1 .75-.75h1.75Z" />
              </svg>
            </div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">No pets yet</h3>
            <p className="text-gray-600 mb-6">Get started by adding your first pet profile</p>
            <Link
              href="/setup"
              className="inline-block bg-[#8f743c] text-white px-6 py-3 rounded-lg hover:bg-[#7d6635] transition-colors"
            >
              Add Your First Pet
            </Link>
          </div>
        )}

        {/* Logout */}
        <div className="mt-12 text-center">
          <form action="/api/auth/logout" method="post">
            <button
              type="submit"
              className="text-gray-500 hover:text-gray-700 text-sm"
            >
              Sign Out
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
