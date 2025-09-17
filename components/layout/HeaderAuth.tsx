"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { useEffect, useState } from "react";
import { getServerSupabaseClient } from "@/lib/supabase";
import { getBrowserSupabaseClient } from "@/lib/supabase-browser";

export default function HeaderAuth() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [ownerName, setOwnerName] = useState<string | null>(null);

  const handleLogout = async () => {
    const supabase = getBrowserSupabaseClient();
    await supabase.auth.signOut();
    router.push("/");
  };

  useEffect(() => {
    // Reflect Owner's name from user metadata; fall back to profile if necessary
    const metaName = user?.user_metadata?.full_name || user?.user_metadata?.fullName;
    if (metaName) {
      setOwnerName(metaName);
    } else if (user?.email) {
      setOwnerName(user.email.split("@")[0]);
    } else {
      setOwnerName(null);
    }
  }, [user?.user_metadata?.full_name, user?.user_metadata?.fullName, user?.email]);

  if (loading) {
    return (
      <div className="text-sm opacity-70" style={{ color: "#2B1F1B" }}>
        Loading...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center gap-4">
        <Link href="/register" className="text-sm" style={{ color: "#2B1F1B" }}>
          Sign Up
        </Link>
        <Link
          href="/login"
          className="px-3 py-1.5 rounded-lg text-sm font-medium text-white"
          style={{ backgroundColor: "#2B1F1B" }}
        >
          Login
        </Link>
      </div>
    );
  }

  const displayName = ownerName || user.user_metadata?.full_name || user.email?.split("@")[0] || "Account";

  return (
    <div className="flex items-center gap-3">
      <span
        className="text-sm select-none"
        style={{ color: "#2B1F1B" }}
      >
        {displayName}
      </span>
      <button
        onClick={handleLogout}
        className="px-3 py-1.5 rounded-lg text-sm font-medium text-white"
        style={{ backgroundColor: "#2B1F1B" }}
      >
        Sign out
      </button>
    </div>
  );
}


