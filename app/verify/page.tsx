"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getBrowserSupabaseClient } from "@/lib/supabase-browser";

function VerifyForm() {
  const [activationCode, setActivationCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showCode, setShowCode] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email');

  useEffect(() => {
    // If no email parameter, redirect to register
    if (!email) {
      router.push('/register');
    }
  }, [email, router]);

  const handleConnect = async () => {
    if (!activationCode.trim()) {
      setError("Please enter the activation code");
      return;
    }

    try {
      setLoading(true);
      setError("");
      
      // Get the user session to include in the request
      const supabase = getBrowserSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setError("Please log in first");
        router.push('/login');
        return;
      }

      // Call the verification API with both tokens
      const response = await fetch('/api/verify-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'X-Refresh-Token': session.refresh_token || '',
        },
        body: JSON.stringify({ 
          code: activationCode,
          session: {
            access_token: session.access_token,
            refresh_token: session.refresh_token
          }
        }),
      });

      const responseText = await response.text();
      const data = responseText ? JSON.parse(responseText) : {};

      if (!response.ok) {
        setError(data.error || "Verification failed");
        return;
      }

      if (data.success) {
        // Redirect based on whether user has pets
        const redirectPath = data.redirectTo || '/dashboard/pets';
        router.push(redirectPath);
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase();
    setActivationCode(value);
    setError("");
  };

  const toggleShowCode = () => {
    setShowCode(!showCode);
  };

  return (
    <main className="min-h-screen relative overflow-hidden">
      {/* Background with gradient */}
      <div className="absolute inset-0" style={{
        background: "linear-gradient(180deg, #8B4513 0%, #A0522D 100%)"
      }}>
        {/* Decorative circle */}
        <div 
          className="absolute top-1/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full opacity-20"
          style={{ backgroundColor: "rgba(255, 255, 255, 0.1)" }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-80px)] px-6">
        <div className="w-full max-w-sm space-y-8">
          {/* Title */}
          <div className="text-center">
            <h1 
              className="text-4xl font-bold mb-4" 
              style={{ color: "#FCEFDC" }}
            >
              ENTER<br />
              ACTIVATION CODE
            </h1>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-lg bg-red-500 bg-opacity-20 border border-red-300">
              <p className="text-red-100 text-sm text-center">{error}</p>
            </div>
          )}

          {/* Input Field */}
          <div className="relative">
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C13.1 2 14 2.9 14 4V6H18C19.1 6 20 6.9 20 8V20C20 21.1 19.1 22 18 22H6C4.9 22 4 21.1 4 20V8C4 6.9 4.9 6 6 6H10V4C10 2.9 10.9 2 12 2M12 4V6H12V4M12 13C13.1 13 14 13.9 14 15S13.1 17 12 17 10 16.1 10 15 10.9 13 12 13Z"/>
              </svg>
            </div>
            <input
              type={showCode ? "text" : "password"}
              value={activationCode}
              onChange={handleCodeChange}
              placeholder="#DEF9977"
              className="w-full pl-12 pr-12 py-4 text-lg font-mono tracking-wider rounded-2xl border-0 text-gray-300 placeholder-gray-500"
              style={{ 
                backgroundColor: "rgba(0, 0, 0, 0.3)",
                backdropFilter: "blur(10px)"
              }}
              maxLength={7}
            />
            <button 
              onClick={toggleShowCode}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-200"
            >
              {showCode ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 4.5C7 4.5 2.73 7.61 1 12C2.73 16.39 7 19.5 12 19.5S21.27 16.39 23 12C21.27 7.61 17 4.5 12 4.5M12 17C9.24 17 7 14.76 7 12S9.24 7 12 7 17 9.24 17 12 14.76 17 12 17M12 9C10.34 9 9 10.34 9 12S10.34 15 12 15 15 13.66 15 12 13.66 9 12 9Z"/>
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M11.83,9L15,12.16C15,12.11 15,12.05 15,12A3,3 0 0,0 12,9C11.94,9 11.89,9 11.83,9M7.53,9.8L9.08,11.35C9.03,11.56 9,11.77 9,12A3,3 0 0,0 12,15C12.22,15 12.44,14.97 12.65,14.92L14.2,16.47C13.53,16.8 12.79,17 12,17A5,5 0 0,1 7,12C7,11.21 7.2,10.47 7.53,9.8M2,4.27L4.28,6.55L4.73,7C3.08,8.3 1.78,10 1,12C2.73,16.39 7,19.5 12,19.5C13.55,19.5 15.03,19.2 16.38,18.66L16.81,19.09L19.73,22L21,20.73L3.27,3M12,7A5,5 0 0,1 17,12C17,12.64 16.87,13.26 16.64,13.82L19.57,16.75C21.07,15.5 22.27,13.86 23,12C21.27,7.61 17,4.5 12,4.5C10.6,4.5 9.26,4.75 8,5.2L10.17,7.35C10.76,7.13 11.37,7 12,7Z"/>
                </svg>
              )}
            </button>
          </div>

          {/* Help Text */}
          <div className="text-center">
            <p className="text-sm opacity-70" style={{ color: "#FCEFDC" }}>
              Where to find the code?
            </p>
          </div>

          {/* Connect Button */}
          <button
            onClick={handleConnect}
            disabled={loading || !activationCode.trim()}
            className="w-full py-4 text-lg font-semibold rounded-2xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundColor: "#EC5914",
              color: "white"
            }}
          >
            {loading ? "Connecting..." : "Connect"}
          </button>

          {/* Back to register link */}
          <div className="text-center">
            <button
              onClick={() => router.push('/register')}
              className="text-sm opacity-70 hover:opacity-100 transition-opacity"
              style={{ color: "#FCEFDC" }}
            >
              Back to Registration
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen relative overflow-hidden">
        <div className="absolute inset-0" style={{
          background: "linear-gradient(180deg, #8B4513 0%, #A0522D 100%)"
        }}>
          <div 
            className="absolute top-1/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full opacity-20"
            style={{ backgroundColor: "rgba(255, 255, 255, 0.1)" }}
          />
        </div>
        <div className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-80px)] px-6">
          <div className="text-center">
            <h1 
              className="text-4xl font-bold mb-4" 
              style={{ color: "#FCEFDC" }}
            >
              Loading...
            </h1>
          </div>
        </div>
      </main>
    }>
      <VerifyForm />
    </Suspense>
  );
}
