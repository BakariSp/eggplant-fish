"use client";

import { useEffect, useRef, useState } from "react";
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
  const [checkingEligibility, setCheckingEligibility] = useState(false);
  const [eligible, setEligible] = useState(false);
  const [claimedTagCode, setClaimedTagCode] = useState<string | null>(null);

  // Util to load current eligibility
  const loadEligibility = async () => {
    if (!user) return;
    setCheckingEligibility(true);
    const supabase = getBrowserSupabaseClient();
    const { data, error } = await supabase
      .from("activation_codes")
      .select("tag_code")
      .eq("used_by", user.id)
      .eq("is_used", true)
      .is("pet_id", null)
      .limit(1)
      .maybeSingle();
    const nextEligible = !error && !!data;
    if (eligible !== nextEligible) setEligible(nextEligible);
    const nextTag = data?.tag_code ?? null;
    if (claimedTagCode !== nextTag) setClaimedTagCode(nextTag);
    if (checkingEligibility !== false) setCheckingEligibility(false);
  };

  // Initial eligibility check (guarded to run once per user id)
  const didInitRef = useRef<string | null>(null);
  useEffect(() => {
    (async () => {
      const uid = user?.id || null;
      if (!uid) return;
      if (didInitRef.current === uid) return; // prevent loops
      didInitRef.current = uid;

      await loadEligibility();
      // Fallback: if not eligible but there is a pending activation in sessionStorage, try to claim now
      try {
        const raw = sessionStorage.getItem("pendingActivation");
        if (raw) {
          const { tag_code, box_code } = JSON.parse(raw);
          if (tag_code && box_code) {
            await fetch("/api/activation/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ tag_code, box_code })
            });
            sessionStorage.removeItem("pendingActivation");
            await loadEligibility();
          }
        }
      } catch {
        // ignore
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

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
      
      // Call server API to create pet and bind activation in one atomic flow
      // Include access token for server to authenticate
      const supabase = getBrowserSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();

      const res = await fetch('/api/pets/create-from-activation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
          ...(user?.id ? { 'x-user-id': user.id } : {}),
        },
        body: JSON.stringify({
          name: petName.trim(),
          breed: (petBreed || '').trim() || null,
          birthdate: petBirthdate || null,
        }),
      });
      const result = await res.json();
      if (!res.ok || !result?.success) {
        throw new Error(result?.error || 'Failed to create pet');
      }

      // Redirect to edit page using tag_code when available (fallback to id)
      router.push(`/dashboard/pets/${(result?.pet?.tag_code || result?.pet?.id)}/edit`);
      
    } catch (err) {
      console.error("Error creating pet:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
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