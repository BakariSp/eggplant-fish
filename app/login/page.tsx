"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { getBrowserSupabaseClient } from "@/lib/supabase-browser";

export default function LoginPage() {
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError("");
      const supabase = getBrowserSupabaseClient();
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`
        }
      });

      if (error) {
        setError(error.message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLogin = async () => {
    try {
      setLoading(true);
      setError("");
      const supabase = getBrowserSupabaseClient();

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
      } else {
        // Check if user has pets before redirecting
        const { data: pets } = await supabase
          .from("pets")
          .select("id")
          .eq("owner_user_id", (await supabase.auth.getUser()).data.user?.id)
          .limit(1);

        if (pets && pets.length > 0) {
          router.push("/dashboard/pets");
        } else {
          router.push("/setup");
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleEmailButtonClick = () => {
    setShowEmailForm(true);
  };

  return (
    <main className="min-h-screen relative" style={{ backgroundColor: "#FCEFDC" }}>
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-64 h-64 opacity-50">
        <Image
          src="/icon/login-bg-img.svg"
          alt=""
          width={256}
          height={256}
          className="object-contain"
        />
      </div>

      {/* Header */}
      <header className="relative z-10 px-6 py-4">
        <div className="text-lg font-bold text-[#8f743c]">
          EGGPLANT.FISH
        </div>
      </header>

      {/* Content */}
      <div className="relative z-10 flex flex-col justify-center px-6 py-12 min-h-[calc(100vh-80px)]">
        <div className="w-full max-w-sm mx-auto space-y-8">
          {/* Title */}
          <div>
            <h1 className="text-3xl font-bold text-[#8f743c] mb-2">
              Login to your<br />account
            </h1>
            <p className="text-[#8f743c] opacity-80">
              Start your journey with us, and let's sharing<br />
              your pet story through our platform!
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Login Form */}
          <div className="space-y-4">
            {!showEmailForm ? (
              <>
                {/* Google Login Button */}
                <Button
                  onClick={handleGoogleLogin}
                  variant="ghost"
                  disabled={loading}
                  className="w-full py-4 rounded-2xl border border-gray-300 bg-white disabled:opacity-50"
                >
                  <div className="flex items-center justify-center space-x-3">
                    <svg width="20" height="20" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    <span className="text-gray-700">Google</span>
                  </div>
                </Button>

                {/* Email Login Button */}
                <Button
                  onClick={handleEmailButtonClick}
                  variant="ghost"
                  className="w-full py-4 rounded-2xl border border-gray-300 bg-white"
                >
                  <div className="flex items-center justify-center space-x-3">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z" stroke="#EC5914" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="L22 6L12 13L2 6" stroke="#EC5914" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span className="text-gray-700">Email / Phone number</span>
                  </div>
                </Button>
              </>
            ) : (
              <>
                {/* Email Form */}
                <div className="space-y-4">
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <path d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z" stroke="#999" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="L22 6L12 13L2 6" stroke="#999" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <Input
                      type="email"
                      placeholder="Enter your email / Phone number"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-12 py-4 rounded-2xl border border-gray-300 bg-white"
                    />
                  </div>

                  <div className="relative">
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke="#999" strokeWidth="2"/>
                        <circle cx="12" cy="16" r="1" fill="#999"/>
                        <path d="M7 11V7A5 5 0 0 1 17 7V11" stroke="#999" strokeWidth="2"/>
                      </svg>
                    </div>
                    <Input
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-12 py-4 rounded-2xl border border-gray-300 bg-white"
                    />
                    <button className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <path d="M1 12S5 4 12 4S23 12 23 12S19 20 12 20S1 12 1 12Z" stroke="#999" strokeWidth="2"/>
                        <circle cx="12" cy="12" r="3" stroke="#999" strokeWidth="2"/>
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Forgot Password */}
                <div className="text-right">
                  <Link href="/forgot-password" className="text-[#EC5914] text-sm">
                    Forgot password?
                  </Link>
                </div>

                {/* Login Button */}
                <Button
                  onClick={handleEmailLogin}
                  disabled={loading || !email || !password}
                  className="w-full py-4 text-lg font-semibold rounded-2xl disabled:opacity-50"
                  style={{ 
                    backgroundColor: "#8f743c",
                    color: "white"
                  }}
                >
                  {loading ? "Logging in..." : "Log in"}
                </Button>
              </>
            )}
          </div>

          {/* Sign Up Link */}
          <div className="text-center text-sm text-gray-600">
            Doesn't have an account?{" "}
            <Link href="/register" className="text-[#EC5914] font-medium">
              create one
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
