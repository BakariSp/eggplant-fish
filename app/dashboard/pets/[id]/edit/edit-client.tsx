"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { getBrowserSupabaseClient } from "@/lib/supabase-browser";

type Profile = {
  pet_id?: string;
  name?: string;
  breed?: string;
  birthdate?: string;
  vaccinated?: boolean;
  vaccinations?: string[];
  allergies?: string[];
  microchip_id?: string;
  neuter_status?: boolean;
  gender?: "male" | "female";
  traits?: string[];
  avatar_url?: string;
};

type Owner = {
  name?: string;
  phone?: string;
  email?: string;
  photo_url?: string;
};

type Emergency = {
  vet?: { name?: string; phone?: string };
};

type Props = { petId: string };

export default function EditProfileClient({ petId }: Props) {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [owner, setOwner] = useState<Owner | null>(null);
  const [emergency, setEmergency] = useState<Emergency | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let mounted = true;
    
    async function loadPetData() {
      try {
        const supabase = getBrowserSupabaseClient();
        
        // Fetch pet profile
        const { data: petData } = await supabase
          .from("pets")
          .select("*")
          .eq("id", petId)
          .single();

        // Fetch contact preferences  
        const { data: contactData } = await supabase
          .from("contact_prefs")
          .select("*")
          .eq("pet_id", petId)
          .single();

        if (!mounted) return;

        if (petData) {
          const profile: Profile = {
            pet_id: petData.id,
            name: petData.name || "",
            breed: petData.breed || "",
            birthdate: petData.birthdate || "",
            vaccinated: petData.vaccinated || false,
            vaccinations: petData.vaccinated ? ["Rabies", "DHPP / DAPP"] : [],
            microchip_id: "077077", // TODO: add to schema
            allergies: petData.allergy_note ? petData.allergy_note.split(",").map((s: string) => s.trim()) : [],
            neuter_status: true, // TODO: add to schema
            gender: "male", // TODO: add to schema
            traits: ["Active", "Friendly"], // TODO: add to schema
            avatar_url: petData.avatar_url || ""
          };
          setProfile(profile);
        }

        if (contactData) {
          const owner: Owner = {
            pet_id: contactData.pet_id,
            name: "Pet Owner", // TODO: get from auth.users
            phone: contactData.phone || "",
            email: contactData.email || "",
            address: "" // TODO: add to schema
          };
          setOwner(owner);
        }

        // Set default emergency data for now
        setEmergency({
          pet_id: petId,
          vet_name: "Local Vet Clinic",
          vet_phone: "555-0123",
          vet_address: "123 Main St"
        });

        setLoading(false);
      } catch (error) {
        console.error("Error loading pet data:", error);
        if (mounted) setLoading(false);
      }
    }

    loadPetData();
    return () => { mounted = false; };
  }, [petId]);

  const formatAge = (birthdate?: string): string => {
    if (!birthdate) return "1y 4m";
    const birth = new Date(birthdate);
    if (Number.isNaN(birth.getTime())) return "1y 4m";
    const now = new Date();
    let years = now.getFullYear() - birth.getFullYear();
    let months = now.getMonth() - birth.getMonth();
    if (months < 0) {
      years -= 1;
      months += 12;
    }
    return `${years}y ${months}m`;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Simulate save operation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In a real app, you would save the form data here
      console.log("Profile saved successfully");
      
      // Navigate back to the posts page
      router.push(`/dashboard/pets/${petId}/posts`);
    } catch (error) {
      console.error("Failed to save profile:", error);
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      {/* Header */}
      <header className="flex items-center justify-between py-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.push(`/dashboard/pets/${petId}/posts`)}
            className="text-lg"
            aria-label="Go back"
          >
            ←
          </button>
          <div className="text-lg font-semibold">EGGPLANT.FISH</div>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 text-sm rounded-full border border-gray-300 bg-white">
            Sign Up
          </button>
          <button className="px-4 py-2 text-sm rounded-full bg-black text-white">
            Login
          </button>
        </div>
      </header>

      <div className="border-t border-gray-300 mb-8" />

      <h1 className="text-2xl font-bold text-center mb-8" style={{ color: "#2B1B12" }}>
        Edit Profile
      </h1>

      <form className="space-y-6" onSubmit={handleSave}>
        {/* Pet Name */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: "#2B1B12" }}>
            Pet Name
          </label>
          <input
            type="text"
            defaultValue={profile?.name || ""}
            className="w-full px-4 py-3 rounded-xl border-0 bg-white text-gray-600"
            placeholder="Pet name"
          />
        </div>

        {/* Owner's Name */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: "#2B1B12" }}>
            Owner's Name
          </label>
          <input
            type="text"
            defaultValue={owner?.name || ""}
            className="w-full px-4 py-3 rounded-xl border-0 bg-white text-gray-600"
            placeholder="Owner name"
          />
        </div>

        {/* Pet Gender & Age */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: "#2B1B12" }}>
              Pet Gender
            </label>
            <select
              defaultValue={profile?.gender || "female"}
              className="w-full px-4 py-3 rounded-xl border-0 bg-white text-gray-600 appearance-none"
            >
              <option value="female">Female</option>
              <option value="male">Male</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: "#2B1B12" }}>
              Pet Age
            </label>
            <input
              type="text"
              defaultValue={formatAge(profile?.birthdate)}
              className="w-full px-4 py-3 rounded-xl border-0 bg-white text-gray-600"
              placeholder="1y 4m"
            />
          </div>
        </div>

        {/* Microchip ID */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: "#2B1B12" }}>
            Microchip ID
          </label>
          <input
            type="text"
            defaultValue={profile?.microchip_id || ""}
            className="w-full px-4 py-3 rounded-xl border-0 bg-white text-gray-600"
            placeholder="077077"
          />
        </div>

        {/* Neuter Status */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: "#2B1B12" }}>
            Neuter Status
          </label>
          <select
            defaultValue={profile?.neuter_status ? "Yes" : "No"}
            className="w-full px-4 py-3 rounded-xl border-0 bg-white text-gray-600 appearance-none"
          >
            <option value="Yes">Yes</option>
            <option value="No">No</option>
          </select>
        </div>

        {/* Vaccinated */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: "#2B1B12" }}>
            Vaccinated
          </label>
          <input
            type="text"
            defaultValue={profile?.vaccinations?.join(", ") || ""}
            className="w-full px-4 py-3 rounded-xl border-0 bg-white text-gray-600"
            placeholder="Rabies, DHPP / DAPP"
          />
        </div>

        {/* Profile Photos */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: "#2B1B12" }}>
            Profile Photos
          </label>
          <div className="bg-white rounded-xl p-4">
            <div className="flex gap-2 items-center">
              <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100">
                <Image
                  src={profile?.avatar_url || "/dog.png"}
                  alt="Pet photo 1"
                  width={64}
                  height={64}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100">
                <Image
                  src={profile?.avatar_url || "/dog.png"}
                  alt="Pet photo 2"
                  width={64}
                  height={64}
                  className="w-full h-full object-cover"
                />
              </div>
              <button
                type="button"
                className="w-16 h-16 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 text-2xl"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* Pet Tags */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: "#2B1B12" }}>
            Pet Tags
          </label>
          <div className="bg-white rounded-xl p-4">
            <div className="flex flex-wrap gap-2">
              {(profile?.traits || []).map((trait, index) => (
                <span
                  key={index}
                  className="px-3 py-1 rounded-full text-sm bg-gray-200 text-gray-700"
                >
                  {trait}
                </span>
              ))}
              <button
                type="button"
                className="w-8 h-8 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 text-lg"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* Owner's Contact Information */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: "#2B1B12" }}>
            Owner's Contact Information
          </label>
          <div className="bg-white rounded-xl p-6">
            <div className="flex justify-center mb-4">
              <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-200">
                <Image
                  src={owner?.photo_url || "/main.jpg"}
                  alt="Owner photo"
                  width={80}
                  height={80}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Phone:</label>
                <input
                  type="tel"
                  defaultValue={owner?.phone || ""}
                  className="w-full px-0 py-1 border-0 border-b border-gray-200 bg-transparent text-gray-700 focus:border-gray-400 focus:outline-none"
                  placeholder="Phone number"
                />
              </div>
              
              <div>
                <label className="block text-xs text-gray-500 mb-1">Email:</label>
                <input
                  type="email"
                  defaultValue={owner?.email || ""}
                  className="w-full px-0 py-1 border-0 border-b border-gray-200 bg-transparent text-gray-700 focus:border-gray-400 focus:outline-none"
                  placeholder="Email address"
                />
              </div>
              
              <div>
                <label className="block text-xs text-gray-500 mb-1">Emergency Doctor:</label>
                <input
                  type="text"
                  defaultValue={emergency?.vet?.name || ""}
                  className="w-full px-0 py-1 border-0 border-b border-gray-200 bg-transparent text-gray-700 focus:border-gray-400 focus:outline-none"
                  placeholder="Emergency doctor name"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="pt-8">
          <button
            type="submit"
            disabled={saving}
            className="w-full py-4 rounded-xl text-white font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: "#E85E0E" }}
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
}
