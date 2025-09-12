"use client";

import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { getBrowserSupabaseClient } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";

export default function AuthNavbar() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = getBrowserSupabaseClient();
    await supabase.auth.signOut();
    router.push("/");
  };

  if (loading) {
    return (
      <nav className="w-full sticky top-0 z-20 backdrop-blur bg-white/70 border-b border-gray-200">
        <div className="mx-auto max-w-[1100px] px-4 sm:px-5 md:px-8 lg:px-12 h-12 flex items-center justify-between">
          <Link href="/" className="text-sm font-semibold text-gray-800">
            NFC Pet Tag
          </Link>
          <div className="text-sm text-gray-500">Loading...</div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="w-full sticky top-0 z-20 backdrop-blur bg-white/70 border-b border-gray-200">
      <div className="mx-auto max-w-[1100px] px-4 sm:px-5 md:px-8 lg:px-12 h-12 flex items-center justify-between">
        <Link href="/" className="text-sm font-semibold text-gray-800">
          NFC Pet Tag
        </Link>
        
        <div className="flex items-center gap-4">
          {user ? (
            // 已登录状态
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">
                Welcome, {user.email}
              </span>
              <Link 
                href="/dashboard" 
                className="text-sm text-gray-600 hover:text-gray-800"
              >
                Dashboard
              </Link>
              <button
                onClick={handleLogout}
                className="text-sm text-gray-600 hover:text-gray-800"
              >
                Log Out
              </button>
            </div>
          ) : (
            // 未登录状态
            <div className="flex items-center gap-3">
              <Link 
                href="/login" 
                className="text-sm text-gray-600 hover:text-gray-800"
              >
                Log In
              </Link>
              <Link 
                href="/register" 
                className="text-sm font-medium px-3 py-1.5 rounded-lg text-white bg-blue-500 hover:bg-blue-600"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
