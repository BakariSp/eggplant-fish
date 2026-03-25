"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getBrowserSupabaseClient } from "@/lib/supabase-browser";

export default function AuthRedirect() {
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      try {
        const supabase = getBrowserSupabaseClient();
        
        // Wait for auth to be ready
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          // If we have a pending activation from pre-login verification, claim it now.
          try {
            const raw = sessionStorage.getItem("pendingActivation");
            if (raw) {
              const { tag_code, box_code } = JSON.parse(raw);
              if (tag_code && box_code) {
                let claimed = false;
                try {
                  const apiRes = await fetch("/api/activation/verify", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      ...(session.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
                    },
                    body: JSON.stringify({ tag_code, box_code }),
                  });
                  const apiData = await apiRes.json().catch(() => ({}));
                  claimed = apiRes.ok && !!apiData?.claimed;
                } catch {
                  // Network error — leave pendingActivation intact so landing can retry
                }

                if (claimed) {
                  sessionStorage.removeItem("pendingActivation");
                  router.push("/setup");
                } else {
                  // Claim failed (409 / server error / network) — do NOT clear sessionStorage.
                  // Send user back to landing so the full orchestrator can re-evaluate.
                  router.push(tag_code ? `/landing?id=${encodeURIComponent(tag_code)}` : "/landing");
                }
                return;
              }
              // raw existed but lacked tag_code/box_code — garbage entry, clean up and continue
              sessionStorage.removeItem("pendingActivation");
            }
          } catch {
            // JSON parse error or unexpected — ignore and continue normal routing
          }

          // If user has a claimed activation (no pet yet), force to /setup
          try {
            const { data: pending } = await supabase
              .from('activation_codes')
              .select('tag_code')
              .eq('used_by', session.user.id)
              .eq('is_used', true)
              .is('pet_id', null)
              .limit(1);
            if (pending && pending.length > 0) {
              router.push('/setup');
              return;
            }
          } catch {
            // ignore DB error, fall back to original routing
          }
          
          // Check if user has pets
          const { data: pets } = await supabase
            .from("pets")
            .select("id")
            .eq("owner_user_id", session.user.id)
            .limit(1);

          if (pets && pets.length > 0) {
            router.push('/dashboard/pets');
          } else {
            router.push('/setup');
          }
        } else {
          router.push('/landing');
        }
      } catch (error) {
        console.error("Auth check error:", error);
        router.push('/landing');
      } finally {
        setLoading(false);
      }
    };

    checkAuthAndRedirect();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8f743c] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return null;
}
