"use client";

import { useEffect, useState, useRef, useMemo } from "react";
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
  vaccinated?: string[];
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
  // Stable default arrays to avoid render loops in children relying on reference equality
  const DEFAULT_TAGS_MEMO = useMemo(() => ["Active", "Tries to eat things", "Friendly with cats", "Leash trained"], []);
  const DEFAULT_ALLERGIES_MEMO = useMemo(() => ["Peanuts", "Chicken", "Grass"], []);
  const VACCINE_PLACEHOLDERS = useMemo(() => ["Rabies", "DHPP / DAPP"], []);
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
  const breedRef = useRef<HTMLInputElement>(null);
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
  const [currentAllergies, setCurrentAllergies] = useState<string[]>([]);
  const [currentVaccinations, setCurrentVaccinations] = useState<string[]>([]);

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
        
        // Fetch pet profile from database
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
          .maybeSingle();

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
            ? petData.avatar_url.filter((url: string) => url && url.trim() !== "")
            : [];

          const profile: Profile = {
            pet_id: petData.id,
            name: petData.name || "",
            breed: petData.breed || "",
            birthdate: petData.birthdate || "",
            vaccinated: Array.isArray(petData.vaccinated) ? petData.vaccinated : [],
            microchip_id: petData.microchip_id || "", // Keep null as null, empty string as empty string
            // Keep DB baseline as empty when not set; defaults are for UI only
            allergies: Array.isArray(petData.allergy_note) ? petData.allergy_note : [],
            neuter_status: petData.neuter_status, // Keep null as null
            gender: petData.gender || "", // Keep null as empty string for placeholder
            traits: petData.traits ? (Array.isArray(petData.traits) ? petData.traits : [petData.traits]) : [],
            avatar_url: validAvatarUrls,
            year: petData.year || null, // Load year field
            month: petData.month || null // Load month field
          };
          console.log("📋 Profile data loaded:", profile);
          setProfile(profile);
          
          // Initialize current tags and allergies (use defaults if DB empty)
          setCurrentTags(profile.traits && profile.traits.length > 0 ? profile.traits : DEFAULT_TAGS_MEMO);
          setCurrentAllergies(profile.allergies && profile.allergies.length > 0 ? profile.allergies : DEFAULT_ALLERGIES_MEMO);
          setCurrentVaccinations(profile.vaccinated && profile.vaccinated.length > 0 
            ? profile.vaccinated 
            : (Array.isArray(petData.vaccinated) && petData.vaccinated.length > 0 
                ? petData.vaccinated 
                : VACCINE_PLACEHOLDERS)) ;
          
          // Load existing profile photos from avatar_url array
          if (petData.avatar_url && Array.isArray(petData.avatar_url)) {
            // Filter out empty strings and null values
            const validUrls = petData.avatar_url.filter((url: string) => url && url.trim() !== "");
            setUploadedImages(validUrls);
          }
        }

        // Get current user info for owner name
        const { data: { user } } = await supabase.auth.getUser();
        
        if (contactData) {
          const owner: Owner = {
            name: (contactData as { owner_name?: string })?.owner_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || "",
            phone: contactData.phone || "",
            email: contactData.email || user?.email || "",
            photo_url: user?.user_metadata?.avatar_url || user?.user_metadata?.picture
          };
          console.log("👤 Contact data loaded:", owner);
          setOwner(owner);
        } else {
          console.log("👤 No contact data found, setting default owner");
          setOwner({
            name: user?.user_metadata?.full_name || user?.email?.split('@')[0] || "",
            phone: "",
            email: user?.email || "",
            photo_url: user?.user_metadata?.avatar_url || user?.user_metadata?.picture
          });
        }

        // Set emergency data from contact_prefs.other_link
        setEmergency({
          vet: {
            name: contactData?.other_link || "",
            phone: ""
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
  }, [petId, user, authLoading, DEFAULT_TAGS_MEMO, DEFAULT_ALLERGIES_MEMO, VACCINE_PLACEHOLDERS]);

  // Handle image upload
  const handleImageUpload = (result: { success: boolean; url?: string; path?: string; error?: string }) => {
    if (result.success && result.url) {
      setUploadedImages(prev => {
        const validPrev = prev.filter(url => url && url.trim() !== "");
        if (validPrev.length >= 8) {
          alert("Maximum 8 photos reached. Remove some to upload new ones.");
          return prev;
        }
        return [...prev, result.url!];
      });
      console.log("✅ Image uploaded successfully:", result.url);
    } else {
      console.error("❌ Image upload failed:", result.error);
      alert(`Upload failed: ${result.error}`);
    }
    setIsUploading(false);
  };

  const handleUploadStart = () => {
    const validCount = uploadedImages.filter(url => url && url.trim() !== "").length;
    if (validCount >= 8) {
      alert("Maximum 8 photos reached. Remove some to upload new ones.");
      return;
    }
    setIsUploading(true);
  };

  const removeImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  

  const formatAge = (profile?: Profile): { years: string; months: string } => {
    if (!profile?.year && !profile?.month) return { years: "2", months: "3" }; // Default placeholder
    
    const result = { 
      years: (profile.year || 0).toString(), 
      months: (profile.month || 0).toString() 
    };
    
    console.log("🔢 formatAge called:", {
      profileYear: profile?.year,
      profileMonth: profile?.month,
      result
    });
    
    return result;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("🔥 SAVE BUTTON CLICKED - Form submission started");
    console.log("🔄 Current saving state:", saving);
    
    // Prevent double submission
    if (saving) {
      console.log("⚠️ Already saving, ignoring duplicate submission");
      return;
    }
    
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
      const breed = breedRef.current?.value || "";
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
        breed,
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

      // Update existing pet profile
      const petUpdates: Record<string, string | number | boolean | string[] | null> = {};
      
      // Handle pet name - save if different from current value
      if (petName !== profile?.name) {
        // If the value is the placeholder text, save empty string
        petUpdates.name = petName === "Buddy" ? "" : petName;
      }

      // Handle breed - save if different from current value
      if (breed !== profile?.breed) {
        petUpdates.breed = breed === "French Bulldog" ? "" : breed;
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
          try {
            // Also update client session metadata so Header reflects immediately
            await supabase.auth.updateUser({
              data: { full_name: actualOwnerName }
            });
          } catch (e) {
            console.warn("Failed to update client session metadata, will reflect after refresh", e);
          }
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
      const currentAge = formatAge(profile || undefined);
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
      
      // Handle vaccinations - save as array to DB
      if (Array.isArray(currentVaccinations)) {
        petUpdates.vaccinated = currentVaccinations;
      }
      
      // Handle traits - save if different from current value (including defaults)
      const currentTraits = profile?.traits || [];
      const isTraitsChanged = JSON.stringify(currentTags.sort()) !== JSON.stringify(currentTraits.sort());
      if (isTraitsChanged) {
        petUpdates.traits = currentTags;
        console.log("🏷️ Saving traits:", { currentTags });
      }
      
      // Handle allergies - save if different from current value (including defaults)
      const profileAllergies = profile?.allergies || [];
      const isAllergiesChanged = JSON.stringify(currentAllergies.sort()) !== JSON.stringify(profileAllergies.sort());
      if (isAllergiesChanged) {
        // Save as array for DB array column compatibility
        petUpdates.allergy_note = currentAllergies;
        console.log("🤧 Saving allergies:", { currentAllergies });
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
      const contactUpdates: Record<string, string | boolean | null> = {
        pet_id: petId,
        phone: (phone && phone !== "(555) 123-4567") ? phone : null,
        email: (email && email !== "john.smith@gmail.com") ? email : null,
        show_phone: !!(phone && phone.trim() && phone !== "(555) 123-4567"),
        show_email: !!(email && email.trim() && email !== "john.smith@gmail.com"),
        other_link: (vetName && vetName.trim()) ? vetName : null
      };
      // Also persist owner's display name into contact_prefs.owner_name if available
      if (ownerName && ownerName !== "John Smith") {
        contactUpdates.owner_name = ownerName;
      }
      
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
      
      // Get tag_code to build friendly redirect URL
      const supabaseClient = getBrowserSupabaseClient();
      const { data: petData } = await supabaseClient
        .from("pets")
        .select("tag_code")
        .eq("id", petId)
        .single();
      
      console.log("Pet data after save:", petData);
      
      // Navigate back to current pet's posts page after saving
      const codeOrId = (petData as { tag_code?: string })?.tag_code || petId;
      router.push(`/dashboard/pets/${codeOrId}/posts`);
    } catch (error) {
      console.error("Failed to save profile:", error);
      alert("Failed to save profile. Please try again.");
    } finally {
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
            Owner&apos;s Name
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
                defaultValue={formatAge(profile || undefined).years}
                options={Array.from({ length: 31 }, (_, i) => ({
                  value: i.toString(),
                  label: `${i}y`
                }))}
                className="flex-1 px-4 py-3 rounded-xl border-0 bg-white appearance-none"
              />
              <PlaceholderSelect
                ref={ageMonthRef}
                placeholder="3m"
                defaultValue={formatAge(profile || undefined).months}
                options={Array.from({ length: 12 }, (_, i) => ({
                  value: i.toString(),
                  label: `${i}m`
                }))}
                className="flex-1 px-4 py-3 rounded-xl border-0 bg-white appearance-none"
              />
            </div>
          </div>
        </div>

        {/* Pet Breed - full width on next line */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: "#2B1B12" }}>
            Breed
          </label>
          <PlaceholderInput
            ref={breedRef}
            type="text"
            placeholder="French Bulldog"
            defaultValue={profile?.breed || ""}
            className="w-full px-4 py-3 rounded-xl border-0 bg-white"
          />
        </div>

        {/* Microchip ID */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: "#2B1B12" }}>
            Microchip ID
          </label>
              <PlaceholderInput
            ref={microchipRef}
            type="text"
                placeholder="077077"
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
                { value: "Yes", label: "Yes" },
                { value: "No", label: "No" }
            ]}
              className="w-full px-4 py-3 rounded-xl border-0 bg-white appearance-none"
          />
        </div>

        {/* Vaccinated (as tags) */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: "#2B1B12" }}>
            Vaccinated
          </label>
          <div className="bg-white rounded-xl p-4">
            <PlaceholderTags
              placeholderTags={["Rabies", "DHPP / DAPP"]}
              defaultValue={currentVaccinations}
              onTagsChange={setCurrentVaccinations}
              className=""
            />
          </div>
        </div>

        {/* Profile Photos */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: "#2B1B12" }}>
            Profile Photos
          </label>
          <div className="bg-white rounded-xl p-4 relative">
            {/* Dynamic counter n/8 */}
            <div className="absolute top-3 right-3 text-xs text-gray-500">
              {uploadedImages.filter(url => url && url.trim() !== "").length}/8
            </div>
            <div className="space-y-4">
              {/* Profile Photos */}
              {uploadedImages.filter(url => url && url.trim() !== "").length > 0 && (
                <div>
                  <div className="flex gap-2 flex-wrap">
                    {uploadedImages.filter(url => url && url.trim() !== "").map((url, index) => (
                      <div
                        key={index}
                        className="relative group cursor-pointer"
                        onClick={() => {
                          const validUrls = uploadedImages.filter(url => url && url.trim() !== "");
                          const actualIndex = uploadedImages.indexOf(validUrls[index]);
                          removeImage(actualIndex);
                        }}
                        role="button"
                        aria-label={`Remove profile photo ${index + 1}`}
                      >
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
                          onClick={(e) => {
                            e.stopPropagation();
                            // Find the actual index in the original array
                            const validUrls = uploadedImages.filter(url => url && url.trim() !== "");
                            const actualIndex = uploadedImages.indexOf(validUrls[index]);
                            removeImage(actualIndex);
                          }}
                          className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                        >
                          ×
                        </button>
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
                disabled={isUploading || uploadedImages.filter(url => url && url.trim() !== "").length >= 8}
                capture="environment"
                compressOptions={{ maxDimension: 1200, quality: 0.82, mimeType: "image/webp" }}
                maxFilesRemaining={Math.max(0, 8 - uploadedImages.filter(url => url && url.trim() !== "").length)}
              >
                <div className="text-center py-4">
                  <div className="text-sm text-gray-600 mb-1">
                    {uploadedImages.filter(url => url && url.trim() !== "").length >= 8
                      ? "Maximum photos reached"
                      : isUploading
                        ? "Uploading..."
                        : "Add More Photos"}
                  </div>
                  <div className="text-xs text-gray-500">
                    {uploadedImages.filter(url => url && url.trim() !== "").length >= 8
                      ? "remove some to upload new ones."
                      : "Click or drag to upload photos (up to 50MB each)"}
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
              placeholderTags={DEFAULT_TAGS_MEMO}
              defaultValue={profile?.traits || []}
              onTagsChange={setCurrentTags}
              className=""
            />
          </div>
        </div>

        {/* Allergies */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: "#2B1B12" }}>
            Allergies
          </label>
          <div className="bg-white rounded-xl p-4">
            <PlaceholderTags
              placeholderTags={DEFAULT_ALLERGIES_MEMO}
              defaultValue={profile?.allergies || []}
              onTagsChange={setCurrentAllergies}
              className=""
            />
          </div>
        </div>

        {/* Owner's Contact Information */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: "#2B1B12" }}>
            Owner&apos;s Contact Information
          </label>
          <div className="bg-white rounded-xl p-6">
            <div className="flex justify-center mb-4">
              <div className="relative">
                <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-200">
                  <Image
                    src={owner?.photo_url || "/main.jpg"}
                    alt="Owner photo"
                    width={80}
                    height={80}
                    className="w-full h-full object-cover"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => document.getElementById('owner-avatar-input')?.click()}
                  className="absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-white shadow"
                  style={{ backgroundColor: "#8f743c" }}
                  aria-label="Change avatar"
                  title="Change avatar"
                >
                  ✎
                </button>
                <input
                  id="owner-avatar-input"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const { success, url, error } = await (await import('@/lib/storage')).uploadImage(file, {
                      bucket: 'user-image',
                      folder: `owner/${user?.id || 'unknown'}`,
                      maxSizeBytes: 50 * 1024 * 1024,
                    });
                    if (success && url) {
                      setOwner(prev => ({ ...(prev || {}), photo_url: url }));
                      try {
                        await updateUserProfile({ userId: user!.id, avatarUrl: url });
                      } catch (err) {
                        console.error('Failed to persist avatar url to user profile', err);
                      }
                    } else {
                      alert(error || 'Upload failed');
                    }
                  }}
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
