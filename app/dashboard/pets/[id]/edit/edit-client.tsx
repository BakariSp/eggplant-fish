"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { getBrowserSupabaseClient } from "@/lib/supabase-browser";
import { updateProfile } from "@/server/actions/updateProfile";
import { updateUserProfile } from "@/server/actions/updateUserProfile";
import { PlaceholderInput, PlaceholderSelect, PlaceholderTags } from "@/components/ui/PlaceholderInput";
import PhotoUploader from "@/components/PhotoUploader";
import { getPetAvatarUploadOptions } from "@/lib/storage";
import { useAuth } from "@/components/auth/AuthProvider";

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
  gender?: "male" | "female" | "unknown";
  traits?: string[];
  avatar_url?: string[];
  year?: number;
  month?: number;
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
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [owner, setOwner] = useState<Owner | null>(null);
  const [emergency, setEmergency] = useState<Emergency | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  
  // Form refs for collecting data
  const petNameRef = useRef<HTMLInputElement>(null);
  const ownerNameRef = useRef<HTMLInputElement>(null);
  const genderRef = useRef<HTMLSelectElement>(null);
  const ageYearRef = useRef<HTMLSelectElement>(null);
  const ageMonthRef = useRef<HTMLSelectElement>(null);
  const microchipRef = useRef<HTMLInputElement>(null);
  const neuterRef = useRef<HTMLSelectElement>(null);
  const vaccinationsRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const vetNameRef = useRef<HTMLInputElement>(null);
  const [currentTags, setCurrentTags] = useState<string[]>([]);

  useEffect(() => {
    let mounted = true;
    
    async function loadPetData() {
      // Debug: Check authentication before loading data
      console.log("🔐 Loading data - auth check:", {
        userId: user?.id,
        userEmail: user?.email,
        authLoading,
        isAuthenticated: !!user
      });
      
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
          // Debug: Log raw pet data from database
          console.log("🐾 Raw pet data from database:", {
            id: petData.id,
            name: petData.name,
            gender: petData.gender,
            microchip_id: petData.microchip_id,
            neuter_status: petData.neuter_status,
            year: petData.year,
            month: petData.month,
            traits: petData.traits,
            allergy_note: petData.allergy_note
          });
          
          // Filter out empty/null avatar URLs when loading
          const validAvatarUrls = petData.avatar_url 
            ? petData.avatar_url.filter((url: any) => url && url.trim() !== "")
            : [];

          const profile: Profile = {
            pet_id: petData.id,
            name: petData.name || "",
            breed: petData.breed || "",
            birthdate: petData.birthdate || "",
            vaccinated: petData.vaccinated || false,
            vaccinations: petData.vaccinated ? ["Rabies", "DHPP", "Bordetella"] : [],
            microchip_id: petData.microchip_id || "", // Keep null as null, empty string as empty string
            allergies: petData.allergy_note ? petData.allergy_note.split(",").map((s: string) => s.trim()) : [],
            neuter_status: petData.neuter_status, // Keep null as null
            gender: petData.gender || "", // Keep null as empty string for placeholder
            traits: petData.traits ? (Array.isArray(petData.traits) ? petData.traits : [petData.traits]) : [],
            avatar_url: validAvatarUrls,
            year: petData.year || null, // Load year field
            month: petData.month || null // Load month field
          };
          console.log("📋 Profile data loaded:", profile);
          setProfile(profile);
          
          // Initialize current tags
          setCurrentTags(profile.traits || []);
          
          // Load existing profile photos from avatar_url array
          if (petData.avatar_url && Array.isArray(petData.avatar_url)) {
            // Filter out empty strings and null values
            const validUrls = petData.avatar_url.filter((url: any) => url && url.trim() !== "");
            setUploadedImages(validUrls);
          }
        }

        // Get current user info for owner name
        const { data: { user } } = await supabase.auth.getUser();
        
        if (contactData) {
          const owner: Owner = {
            name: user?.user_metadata?.full_name || user?.email?.split('@')[0] || "",
            phone: contactData.phone || "",
            email: contactData.email || ""
          };
          console.log("👤 Contact data loaded:", owner);
          setOwner(owner);
        } else {
          console.log("👤 No contact data found, setting default owner");
          setOwner({
            name: user?.user_metadata?.full_name || user?.email?.split('@')[0] || "",
            phone: "",
            email: ""
          });
        }

        // Set default emergency data for now
        setEmergency({
          vet: {
            name: "Local Vet Clinic",
            phone: "555-0123"
          }
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

  // Handle image upload
  const handleImageUpload = (result: { success: boolean; url?: string; path?: string; error?: string }) => {
    if (result.success && result.url) {
      setUploadedImages(prev => [...prev, result.url!]);
      console.log("✅ Image uploaded successfully:", result.url);
    } else {
      console.error("❌ Image upload failed:", result.error);
      alert(`Upload failed: ${result.error}`);
    }
    setIsUploading(false);
  };

  const handleUploadStart = () => {
    setIsUploading(true);
  };

  const removeImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleLogout = async () => {
    const supabase = getBrowserSupabaseClient();
    await supabase.auth.signOut();
    router.push("/");
  };

  const formatAge = (profile?: any): { years: string; months: string } => {
    if (!profile?.year && !profile?.month) return { years: "2", months: "3" }; // Default placeholder
    return { 
      years: (profile.year || 0).toString(), 
      months: (profile.month || 0).toString() 
    };
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("🔥 SAVE BUTTON CLICKED - Form submission started");
    
    // Debug: Check client-side authentication
    console.log("🔐 Client-side auth check:", {
      userId: user?.id,
      userEmail: user?.email,
      authLoading,
      isAuthenticated: !!user
    });
    
    setSaving(true);

    try {
      const supabase = getBrowserSupabaseClient();
      
      // Collect form data
      const petName = petNameRef.current?.value || "";
      const ownerName = ownerNameRef.current?.value || "";
      const gender = genderRef.current?.value as "male" | "female" | "unknown" || "unknown";
      const ageYears = ageYearRef.current?.value || "";
      const ageMonths = ageMonthRef.current?.value || "";
      const microchip = microchipRef.current?.value || "";
      const neuter = neuterRef.current?.value === "Yes";
      const vaccinations = vaccinationsRef.current?.value || "";
      const phone = phoneRef.current?.value || "";
      const email = emailRef.current?.value || "";
      const vetName = vetNameRef.current?.value || "";
      
      console.log("📝 Form data collected:", {
        petName,
        ownerName,
        gender,
        ageYears,
        ageMonths,
        microchip,
        neuter,
        vaccinations,
        phone,
        email,
        vetName,
        currentProfile: profile?.name,
        currentYear: profile?.year,
        currentMonth: profile?.month
      });

      // Update pet profile
      const petUpdates: any = {};
      
      // Handle pet name - save if different from current value
      if (petName !== profile?.name) {
        // If the value is the placeholder text, save empty string
        petUpdates.name = petName === "Buddy" ? "" : petName;
      }
      
      // Handle owner name - update user metadata if different from current value
      if (ownerName !== owner?.name && user?.id) {
        const actualOwnerName = ownerName === "John Smith" ? "" : ownerName;
        const updateResult = await updateUserProfile({
          userId: user.id,
          fullName: actualOwnerName
        });
        
        if (!updateResult.ok) {
          console.error("Failed to update owner name:", updateResult.reason);
          alert(`Warning: Could not save owner name: ${updateResult.reason}`);
        } else {
          console.log("✅ Owner name updated successfully");
        }
      }
      
      // Handle new fields - save if different from current value
      if (gender !== profile?.gender) {
        petUpdates.gender = gender === "unknown" ? "unknown" : gender; // If default "unknown", save "unknown"
      }
      if (microchip !== profile?.microchip_id) {
        petUpdates.microchip_id = microchip === "982000123456789" ? null : microchip; // If placeholder, save null
      }
      if (neuter !== profile?.neuter_status) {
        // If placeholder "Not Spayed/Neutered" is selected, save null
        const neuterValue = neuterRef.current?.value;
        if (neuterValue === "" || neuterValue === undefined) {
          petUpdates.neuter_status = null; // Placeholder selected
        } else {
          petUpdates.neuter_status = neuter; // Actual selection
        }
      }
      
      // Handle age - save year and month directly
      const currentAge = formatAge(profile);
      console.log("🔢 Age comparison:", {
        ageYears,
        ageMonths,
        currentAge,
        profileYear: profile?.year,
        profileMonth: profile?.month
      });
      
      if (ageYears !== currentAge.years || ageMonths !== currentAge.months) {
        if (ageYears === "2" && ageMonths === "3") {
          // If placeholder, clear year and month
          petUpdates.year = null;
          petUpdates.month = null;
          console.log("🗑️ Clearing age (placeholder selected)");
        } else {
          // Save year and month directly
          petUpdates.year = parseInt(ageYears);
          petUpdates.month = parseInt(ageMonths);
          console.log("💾 Saving age:", { year: petUpdates.year, month: petUpdates.month });
        }
      } else {
        console.log("⏭️ Age unchanged, skipping update");
      }
      
      // Handle uploaded images - save all uploaded images to avatar_url array
      if (uploadedImages.length > 0) {
        petUpdates.avatar_url = uploadedImages;
      }
      
      // Handle vaccinations - save if different from current value
      if (vaccinations !== profile?.allergies?.join(", ")) {
        const vaccinationText = vaccinations === "Rabies, DHPP, Bordetella" ? "" : vaccinations.trim();
        petUpdates.vaccinated = vaccinationText.length > 0;
        petUpdates.allergy_note = vaccinationText || null; // Store vaccinations in allergy_note for now
      }
      
      // Handle traits - save if different from current value
      const currentTraits = profile?.traits || [];
      const isTraitsChanged = JSON.stringify(currentTags.sort()) !== JSON.stringify(currentTraits.sort());
      if (isTraitsChanged) {
        // Check if current tags are just placeholder tags
        const placeholderTags = ["Friendly", "Active", "Smart"];
        const isPlaceholderTags = currentTags.length === placeholderTags.length && 
          currentTags.every(tag => placeholderTags.includes(tag));
        
        if (isPlaceholderTags) {
          petUpdates.traits = null; // Save null if placeholder tags
        } else {
          petUpdates.traits = currentTags; // Save actual tags
        }
        console.log("🏷️ Saving traits:", { currentTags, isPlaceholderTags, savedValue: petUpdates.traits });
      }
      
      console.log("Updating pet profile:", { petId, petUpdates });
      
      if (Object.keys(petUpdates).length > 0) {
        const updateData = {
          id: petId,
          ...petUpdates
        };
        console.log("Sending update data to updateProfile:", updateData);
        
        const result = await updateProfile(updateData);
        
        console.log("Update result:", result);
        
        if (!result.ok) {
          console.error("Update failed:", result.reason);
          throw new Error(result.reason);
        }
      } else {
        console.log("No pet profile changes to save");
      }

      // Update contact preferences - only update if not placeholder values
      const contactUpdates = {
        pet_id: petId,
        phone: (phone && phone !== "(555) 123-4567") ? phone : null,
        email: (email && email !== "john.smith@gmail.com") ? email : null,
        show_phone: !!(phone && phone.trim() && phone !== "(555) 123-4567"),
        show_email: !!(email && email.trim() && email !== "john.smith@gmail.com")
      };
      
      console.log("🔄 Updating contact preferences:", contactUpdates);
      
      // Try to upsert contact preferences
      const { error: contactError, data: contactResult } = await supabase
        .from("contact_prefs")
        .upsert(contactUpdates, { 
          onConflict: 'pet_id',
          ignoreDuplicates: false 
        })
        .select();
      
      if (contactError) {
        console.error("❌ Contact update error:", contactError);
        // Don't throw error for contact prefs, just log it
        alert(`Warning: Could not save contact preferences: ${contactError.message}`);
      } else {
        console.log("✅ Contact preferences updated successfully:", contactResult);
      }

      console.log("Profile saved successfully");
      
      // Small delay to ensure database changes are committed
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Get the pet slug to redirect to public profile
      const supabaseClient = getBrowserSupabaseClient();
      const { data: petData } = await supabaseClient
        .from("pets")
        .select("slug, name")
        .eq("id", petId)
        .single();
      
      console.log("Pet data after save:", petData);
      
      if (petData?.slug) {
        // Navigate to the public profile to see the changes
        router.push(`/p/${petData.slug}`);
      } else {
        // Fallback to dashboard if slug not found
        router.push(`/dashboard/pets`);
      }
    } catch (error) {
      console.error("Failed to save profile:", error);
      alert("Failed to save profile. Please try again.");
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
          {authLoading ? (
            <div className="text-sm text-gray-500">Loading...</div>
          ) : user ? (
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">
                {user.email}
              </span>
              <button 
                onClick={handleLogout}
                className="px-4 py-2 text-sm rounded-full bg-black text-white hover:bg-gray-800"
              >
                Log Out
              </button>
            </div>
          ) : (
            <>
              <button 
                onClick={() => router.push("/register")}
                className="px-4 py-2 text-sm rounded-full border border-gray-300 bg-white hover:bg-gray-50"
              >
                Sign Up
              </button>
              <button 
                onClick={() => router.push("/login")}
                className="px-4 py-2 text-sm rounded-full bg-black text-white hover:bg-gray-800"
              >
                Login
              </button>
            </>
          )}
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
          <PlaceholderInput
            ref={petNameRef}
            type="text"
            placeholder="Buddy"
            defaultValue={profile?.name || ""}
            className="w-full px-4 py-3 rounded-xl border-0 bg-white"
          />
        </div>

        {/* Owner's Name */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: "#2B1B12" }}>
            Owner's Name
          </label>
          <PlaceholderInput
            ref={ownerNameRef}
            type="text"
            placeholder="John Smith"
            defaultValue={owner?.name || ""}
            className="w-full px-4 py-3 rounded-xl border-0 bg-white"
          />
        </div>

        {/* Pet Gender & Age */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: "#2B1B12" }}>
              Pet Gender
            </label>
            <PlaceholderSelect
              ref={genderRef}
              placeholder="Unknown"
              defaultValue={profile?.gender || "unknown"}
              options={[
                { value: "female", label: "Female" },
                { value: "male", label: "Male" },
                { value: "unknown", label: "Unknown" }
              ]}
              className="w-full px-4 py-3 rounded-xl border-0 bg-white appearance-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: "#2B1B12" }}>
              Pet Age
            </label>
            <div className="flex gap-2">
              <PlaceholderSelect
                ref={ageYearRef}
                placeholder="2y"
                defaultValue={formatAge(profile).years}
                options={Array.from({ length: 31 }, (_, i) => ({
                  value: i.toString(),
                  label: `${i}y`
                }))}
                className="flex-1 px-4 py-3 rounded-xl border-0 bg-white appearance-none"
              />
              <PlaceholderSelect
                ref={ageMonthRef}
                placeholder="3m"
                defaultValue={formatAge(profile).months}
                options={Array.from({ length: 12 }, (_, i) => ({
                  value: i.toString(),
                  label: `${i}m`
                }))}
                className="flex-1 px-4 py-3 rounded-xl border-0 bg-white appearance-none"
              />
            </div>
          </div>
        </div>

        {/* Microchip ID */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: "#2B1B12" }}>
            Microchip ID
          </label>
          <PlaceholderInput
            ref={microchipRef}
            type="text"
            placeholder="982000123456789"
            defaultValue={profile?.microchip_id || ""}
            className="w-full px-4 py-3 rounded-xl border-0 bg-white"
          />
        </div>

        {/* Neuter Status */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: "#2B1B12" }}>
            Neuter Status
          </label>
          <PlaceholderSelect
            ref={neuterRef}
            placeholder="Not Spayed/Neutered"
            defaultValue={profile?.neuter_status !== null && profile?.neuter_status !== undefined ? (profile.neuter_status ? "Yes" : "No") : ""}
            options={[
              { value: "Yes", label: "Spayed/Neutered" },
              { value: "No", label: "Not Spayed/Neutered" }
            ]}
            className="w-full px-4 py-3 rounded-xl border-0 bg-white appearance-none"
          />
        </div>

        {/* Vaccinated */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: "#2B1B12" }}>
            Vaccinated
          </label>
          <PlaceholderInput
            ref={vaccinationsRef}
            type="text"
            placeholder="Rabies, DHPP, Bordetella"
            defaultValue={profile?.vaccinations?.join(", ") || ""}
            className="w-full px-4 py-3 rounded-xl border-0 bg-white"
          />
        </div>

        {/* Profile Photos */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: "#2B1B12" }}>
            Profile Photos
          </label>
          <div className="bg-white rounded-xl p-4">
            <div className="space-y-4">
              {/* Current Avatar */}
              <div className="flex gap-2 items-center">
                <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100">
                  <Image
                    src={
                      (profile?.avatar_url && Array.isArray(profile.avatar_url) && profile.avatar_url.length > 0) 
                        ? profile.avatar_url[0] 
                        : "/dog.png"
                    }
                    alt="Current pet avatar"
                    width={64}
                    height={64}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="text-sm text-gray-600">
                  Current Avatar
                </div>
              </div>

              {/* Profile Photos */}
              {uploadedImages.filter(url => url && url.trim() !== "").length > 0 && (
                <div>
                  <div className="text-sm text-gray-600 mb-2">Profile Photos ({uploadedImages.filter(url => url && url.trim() !== "").length})</div>
                  <div className="flex gap-2 flex-wrap">
                    {uploadedImages.filter(url => url && url.trim() !== "").map((url, index) => (
                      <div key={index} className="relative group">
                        <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100">
                          <Image
                            src={url}
                            alt={`Profile photo ${index + 1}`}
                            width={64}
                            height={64}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            // Find the actual index in the original array
                            const validUrls = uploadedImages.filter(url => url && url.trim() !== "");
                            const actualIndex = uploadedImages.indexOf(validUrls[index]);
                            removeImage(actualIndex);
                          }}
                          className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          ×
                        </button>
                        {index === 0 && (
                          <div className="absolute bottom-0 left-0 right-0 bg-blue-500 text-white text-xs text-center py-0.5">
                            Avatar
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Upload Area */}
              <PhotoUploader
                uploadOptions={getPetAvatarUploadOptions(petId)}
                onUploadStart={handleUploadStart}
                onUploadComplete={handleImageUpload}
                multiple={true}
                className="w-full"
                disabled={isUploading}
              >
                <div className="text-center py-4">
                  <div className="text-sm text-gray-600 mb-1">
                    {isUploading ? "Uploading..." : "Add More Photos"}
                  </div>
                  <div className="text-xs text-gray-500">
                    Click or drag to upload photos (up to 50MB each)
                  </div>
                </div>
              </PhotoUploader>
            </div>
          </div>
        </div>

        {/* Pet Tags */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: "#2B1B12" }}>
            Pet Tags
          </label>
          <div className="bg-white rounded-xl p-4">
            <PlaceholderTags
              placeholderTags={["Friendly", "Active", "Smart"]}
              defaultValue={profile?.traits || []}
              onTagsChange={setCurrentTags}
              className=""
            />
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
                <PlaceholderInput
                  ref={phoneRef}
                  type="tel"
                  placeholder="(555) 123-4567"
                  defaultValue={owner?.phone || ""}
                  className="w-full px-0 py-1 border-0 border-b border-gray-200 bg-transparent focus:border-gray-400 focus:outline-none"
                />
              </div>
              
              <div>
                <label className="block text-xs text-gray-500 mb-1">Email:</label>
                <PlaceholderInput
                  ref={emailRef}
                  type="email"
                  placeholder="john.smith@gmail.com"
                  defaultValue={owner?.email || ""}
                  className="w-full px-0 py-1 border-0 border-b border-gray-200 bg-transparent focus:border-gray-400 focus:outline-none"
                />
              </div>
              
              <div>
                <label className="block text-xs text-gray-500 mb-1">Emergency Doctor:</label>
                <PlaceholderInput
                  ref={vetNameRef}
                  type="text"
                  placeholder="Dr. Johnson"
                  defaultValue={emergency?.vet?.name || ""}
                  className="w-full px-0 py-1 border-0 border-b border-gray-200 bg-transparent focus:border-gray-400 focus:outline-none"
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
