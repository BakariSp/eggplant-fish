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
          console.log("Authenticated user found:", session.user.email);
          
          // Check if user has pets
          const { data: pets } = await supabase
            .from("pets")
            .select("id")
            .eq("owner_user_id", session.user.id)
            .limit(1);
          
          console.log("User has pets:", pets?.length || 0);
          
          if (pets && pets.length > 0) {
            router.push('/dashboard/pets');
          } else {
            router.push('/setup');
          }
        } else {
          console.log("No authenticated user, redirecting to landing");
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
