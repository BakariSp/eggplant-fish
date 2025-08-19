"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getBrowserSupabaseClient } from "@/lib/supabase-browser";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

export default function SetupPage() {
  const [petName, setPetName] = useState("");
  const [petBreed, setPetBreed] = useState("");
  const [petBirthdate, setPetBirthdate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const generateSlug = (name: string) => {
    return name.toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') + '-' + Math.random().toString(36).substr(2, 6);
  };

  const handleCreatePet = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!petName.trim()) {
      setError("Pet name is required");
      return;
    }

    try {
      setLoading(true);
      setError("");
      
      const supabase = getBrowserSupabaseClient();
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError("You must be logged in to create a pet profile");
        return;
      }

      const slug = generateSlug(petName);

      // Create pet profile
      const { data: pet, error: petError } = await supabase
        .from("pets")
        .insert({
          name: petName.trim(),
          breed: petBreed.trim() || null,
          birthdate: petBirthdate || null,
          slug: slug,
          owner_user_id: user.id,
          vaccinated: false,
          lost_mode: false
        })
        .select()
        .single();

      if (petError) {
        setError(petError.message);
        return;
      }

      // Create default contact preferences
      await supabase
        .from("contact_prefs")
        .insert({
          pet_id: pet.id,
          show_phone: false,
          show_email: false,
          show_sms: false
        });

      // Redirect to edit page
      router.push(`/dashboard/pets/${pet.id}/edit`);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-center text-gray-900 mb-6">
            Create Pet Profile
          </h1>
          
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 mb-4">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleCreatePet} className="space-y-4">
            <div>
              <label htmlFor="petName" className="block text-sm font-medium text-gray-700 mb-1">
                Pet Name *
              </label>
              <Input
                id="petName"
                type="text"
                value={petName}
                onChange={(e) => setPetName(e.target.value)}
                placeholder="Enter your pet's name"
                className="w-full"
                required
              />
            </div>

            <div>
              <label htmlFor="petBreed" className="block text-sm font-medium text-gray-700 mb-1">
                Breed
              </label>
              <Input
                id="petBreed"
                type="text"
                value={petBreed}
                onChange={(e) => setPetBreed(e.target.value)}
                placeholder="e.g., Golden Retriever, Mixed"
                className="w-full"
              />
            </div>

            <div>
              <label htmlFor="petBirthdate" className="block text-sm font-medium text-gray-700 mb-1">
                Birth Date
              </label>
              <Input
                id="petBirthdate"
                type="date"
                value={petBirthdate}
                onChange={(e) => setPetBirthdate(e.target.value)}
                className="w-full"
              />
            </div>

            <Button
              type="submit"
              disabled={loading || !petName.trim()}
              className="w-full py-3 text-lg font-semibold rounded-lg disabled:opacity-50"
              style={{ 
                backgroundColor: "#8f743c",
                color: "white"
              }}
            >
              {loading ? "Creating..." : "Create Pet Profile"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => router.push("/dashboard/pets")}
              className="text-gray-500 hover:text-gray-700 text-sm"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}


