"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
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
  const { user } = useAuth();

  const handleCreatePet = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!petName.trim()) {
      setError("Pet name is required");
      return;
    }

    if (!user) {
      setError("Please log in to create a pet profile");
      return;
    }

    try {
      setLoading(true);
      setError("");
      
      const supabase = getBrowserSupabaseClient();
      
      // Calculate age from birthdate
      const { year, month } = calculateAgeFromBirthdate(petBirthdate);
      
      console.log("📅 Setup page - Age calculation:", {
        birthdate: petBirthdate,
        calculatedYear: year,
        calculatedMonth: month
      });
      
      // Generate slug for the pet
      const slug = petName.toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '') + '-' + Math.random().toString(36).substr(2, 6);
      
      // Create pet record in database
      const { data: pet, error: petError } = await supabase
        .from("pets")
        .insert({
          name: petName.trim(),
          breed: petBreed.trim() || null,
          birthdate: petBirthdate || null,
          slug: slug,
          owner_user_id: user.id,
          vaccinated: ["Rabies", "DHPP / DAPP"], // Default vaccinations
          allergy_note: ["Peanuts", "Chicken", "Grass"], // Default allergies
          traits: ["Active", "Tries to eat things", "Friendly with cats", "Leash trained"], // Default traits
          lost_mode: false,
          gender: "unknown",
          neuter_status: null,
          year: year,
          month: month,
          microchip_id: null,
          avatar_url: []
        })
        .select()
        .single();

      if (petError) {
        throw new Error(petError.message);
      }

      console.log("🐾 Pet created successfully:", pet);

      // Create contact preferences record
      const { error: contactError } = await supabase
        .from("contact_prefs")
        .insert({
          pet_id: pet.id,
          owner_name: user.user_metadata?.full_name || user.email?.split('@')[0] || null,
          phone: null,
          email: user.email || null,
          show_phone: false,
          show_email: true,
          show_sms: false
        });

      if (contactError) {
        console.warn("Failed to create contact preferences:", contactError);
        // Don't throw error for contact prefs, just log it
      }

      // Redirect to edit page with the real pet ID
      router.push(`/dashboard/pets/${pet.id}/edit`);
      
    } catch (err) {
      console.error("Error creating pet:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const calculateAgeFromBirthdate = (birthdate: string) => {
    if (!birthdate) return { year: null, month: null };
    
    const birth = new Date(birthdate);
    const now = new Date();
    
    let years = now.getFullYear() - birth.getFullYear();
    let months = now.getMonth() - birth.getMonth();
    
    if (months < 0) {
      years--;
      months += 12;
    }
    
    // If the pet is less than 1 month old, set to 1 month
    if (years === 0 && months === 0) {
      months = 1;
    }
    
    return { year: years, month: months };
  };

  return (
    <main className="min-h-screen" style={{ backgroundColor: "#FCEFDC" }}>
      <div className="max-w-md mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-center mb-6" style={{ color: "#2B1F1B" }}>
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
                max={new Date().toISOString().split('T')[0]}
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