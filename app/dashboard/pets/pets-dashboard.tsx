"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getBrowserSupabaseClient } from "@/lib/supabase-browser";

interface Pet {
  id: string;
  slug: string;
  name: string;
  breed: string;
  avatar_url: string | string[];
  created_at: string;
  year: number | null;
  month: number | null;
}

export default function PetsDashboard() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any | null>(null);
  const router = useRouter();

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const supabase = getBrowserSupabaseClient();
        
        // Check authentication
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session?.user) {
          router.push("/login");
          return;
        }

        setUser(session.user);

        // Fetch user's pets
        const { data: pets } = await supabase
          .from("pets")
          .select("id, slug, name, breed, avatar_url, created_at, year, month")
          .eq("owner_user_id", session.user.id)
          .order("created_at", { ascending: false });

        setPets(pets || []);
      } catch (error) {
        console.error("Error loading dashboard:", error);
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#FCEFDC" }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8f743c] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your pets...</p>
        </div>
        {/* Search placed between banner and header */}
        <div className="relative mt-4 mb-6 z-0">
          <input
            type="text"
            placeholder="Search"
            className="w-full h-12 rounded-full bg-white shadow-sm px-5 pr-10 outline-none focus:ring-2"
            style={{ border: "2px solid #EC5914", color: "#2B1F1B" }}
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 right-4 text-[#EC5914]"
            aria-hidden
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="7" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
        </div>

        
      </div>
    );
  }

  return (
    <main className="min-h-screen" style={{ backgroundColor: "#FCEFDC" }}>
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Welcome Banner */}
        <div
          className="relative rounded-2xl p-4 mb-6 shadow-sm min-h-[120px]"
          style={{
            background: "linear-gradient(135deg, #EC5914 0%, #D4490F 100%)",
          }}
        >
          <div className="grid grid-cols-[30%_70%] items-center gap-4">
            <div className="h-28 aspect-square rounded-xl overflow-hidden bg-white/10">
              {(() => {
                const avatarUrl = user?.user_metadata?.avatar_url || user?.user_metadata?.picture;
                if (avatarUrl) {
                  return (
                    <img
                      src={avatarUrl}
                      alt="Owner avatar"
                      className="w-full h-full object-cover"
                    />
                  );
                }
                // Transparent placeholder with same size to preserve layout
                return (
                  <div aria-label="Avatar placeholder" className="w-full h-full">
                    <img
                      src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw=="
                      alt=""
                      className="w-full h-full object-cover opacity-0"
                    />
                  </div>
                );
              })()}
            </div>
            <div className="text-white pl-2 sm:pl-4">
            <div className="text-[13px] opacity-90 mb-1">Welcome Back!</div>
              <div
                className="text-2xl sm:text-3xl font-extrabold leading-snug"
                style={{ fontFamily: "var(--font-display), var(--font-quicksand), Arial" }}
              >
                {(user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Pet Owner") + "’s"}
                <br />
                Pet Dashboard
              </div>
            </div>
          </div>
          <button
            aria-label="Notifications"
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white text-[#2B1F1B] flex items-center justify-center shadow ring-1 ring-black/10"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22c1.1 0 2-.9 2-2H10c0 1.1.9 2 2 2Z"/>
              <path d="M18 16v-5a6 6 0 1 0-12 0v5l-2 2v1h16v-1l-2-2Z"/>
            </svg>
          </button>
        </div>
        {/* Search between banner and header */}
        <div className="relative mt-2 mb-6 z-0">
          <input
            type="text"
            placeholder="Search"
            className="w-full h-12 rounded-full bg-[color:var(--background)] shadow-sm px-5 pr-12 outline-none focus:ring-0 placeholder-[#8f743c]"
            style={{ border: "2px solid #EC5914" }}
          />
          <div className="absolute top-1/2 -translate-y-1/2 right-4 text-[#EC5914]" aria-hidden>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="7" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
        </div>

        {/* Header */}
        <div className="flex justify-between items-center mb-4">
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
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {pets.map((pet) => (
              <div key={pet.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                <div className="h-48 bg-gray-200 relative">
                  {(() => {
                    // Get first valid avatar URL
                    let avatarSrc = null;
                    if (pet.avatar_url) {
                      if (Array.isArray(pet.avatar_url)) {
                        avatarSrc = pet.avatar_url.find(url => url && url.trim() !== "") || null;
                      } else if (typeof pet.avatar_url === 'string' && pet.avatar_url.trim() !== "") {
                        avatarSrc = pet.avatar_url;
                      }
                    }
                    
                    return avatarSrc ? (
                      <img
                        src={avatarSrc}
                        alt={pet.name || "Pet"}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M4.5 12.75a6 6 0 0 1 11.25-2.25H18a.75.75 0 0 1 .75.75v7.5a.75.75 0 0 1-.75.75h-1.5a.75.75 0 0 1-.75-.75v-4.5a3 3 0 1 0-6 0v4.5a.75.75 0 0 1-.75.75H7.5a.75.75 0 0 1-.75-.75v-7.5a.75.75 0 0 1 .75-.75h1.75Z" />
                        </svg>
                      </div>
                    );
                  })()}
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-lg text-gray-900">
                      {pet.name || "Unnamed Pet"}
                    </h3>
                    <span className="text-gray-500 text-sm">
                      {(() => {
                        const years = pet.year || 0;
                        const months = pet.month || 0;
                        let ageParts = [];
                        if (years > 0) ageParts.push(`${years}y`);
                        if (months > 0) ageParts.push(`${months}m`);
                        return ageParts.join(" ") || "0m";
                      })()}
                    </span>
                  </div>
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
                  {/* Removed public profile entry per new UX: only Manage Posts remains */}
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

        
      </div>
    </main>
  );
}
