"use client";

import Image from "next/image";
import Button from "@/components/ui/Button";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { getBrowserSupabaseClient } from "@/lib/supabase-browser";

export default function LandingPage() {
  const searchParams = useSearchParams();
  const tagCode = useMemo(() => (searchParams.get("id") || "").trim(), [searchParams]);
  const step = useMemo(() => searchParams.get("step") || "", [searchParams]);
  const router = useRouter();

  const [showForm, setShowForm] = useState(false);
  const [boxCode, setBoxCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState("");

  // If this tag_code already has a pet, redirect to dashboard posts using the tag_code
  useEffect(() => {
    (async () => {
      if (!tagCode) return;
      try {
        const supabase = getBrowserSupabaseClient();
        const { data: pet } = await supabase
          .from("pets")
          .select("id")
          .eq("tag_code", tagCode)
          .maybeSingle();
        if (pet) {
          router.replace(`/dashboard/pets/${tagCode}/posts`);
        }
      } catch {
        // ignore
      }
    })();
  }, [tagCode, router]);

  useEffect(() => {
    setVerified(false);
    setError("");
  }, [boxCode, tagCode]);

  // If redirected back from OAuth with step=code, ensure form is open and restore cached box code
  useEffect(() => {
    if (step === "code") {
      setShowForm(true);
      try {
        const cached = sessionStorage.getItem("ef.box_code");
        if (cached) {
          setBoxCode(cached);
          sessionStorage.removeItem("ef.box_code");
        }
      } catch {}
    }
  }, [step]);

  const handleVerify = async () => {
    if (!tagCode) {
      setError("Missing tag code. Please scan the NFC tag again.");
      return;
    }
    if (!boxCode || boxCode.length < 6) {
      setError("Please enter your 6-character BOX CODE");
      return;
    }
    try {
      setVerifying(true);
      setError("");
      const supabase = getBrowserSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        // Save and go to Google; return to this page focused on code entry
        try {
          sessionStorage.setItem("ef.box_code", boxCode);
          sessionStorage.setItem("pendingActivation", JSON.stringify({ tag_code: tagCode, box_code: boxCode.toUpperCase() }));
        } catch {}
        const redirectTo = `${window.location.origin}/landing?id=${encodeURIComponent(tagCode)}&step=code`;
        await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo } });
        return;
      }

      const res = await fetch("/api/activation/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({ tag_code: tagCode, box_code: boxCode })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.success) {
        setVerified(false);
        setError(data?.error || "Verification failed. Please check your code.");
        return;
      }
      setVerified(true);
      router.push(data?.data?.redirectTo || "/setup");
    } catch (e) {
      setVerified(false);
      setError(e instanceof Error ? e.message : "Verification failed");
    } finally {
      setVerifying(false);
    }
  };

  const handleGoogleConnect = async () => {
    try {
      const supabase = getBrowserSupabaseClient();
      try { if (boxCode) sessionStorage.setItem("ef.box_code", boxCode); } catch {}
      const redirectTo = `${window.location.origin}/landing?id=${encodeURIComponent(tagCode)}&step=code`;
      await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo } });
    } catch {
      // surface errors via provider redirect; keep UI simple here
    }
  };

  return (
    <main className="min-h-screen" style={{ backgroundColor: "#FCEFDC" }}>
      <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
        <div className="mb-12 w-full max-w-md">
          <div className="relative w-full max-w-[300px] mx-auto">
            <Image
              src="/icon/landing-page.svg"
              alt="Pet NFC App Hero Illustration"
              width={364}
              height={358}
              className="w-full h-auto"
              priority
            />
          </div>
        </div>

        <div className="mb-8">
          <h1 className="text-4xl font-bold text-[#8f743c] mb-2">
            Welcome to<br />EGGPLANT.FISH
          </h1>
          {tagCode && (
            <p className="text-sm text-[#8f743c] opacity-80">Tag: {tagCode}</p>
          )}
          {!tagCode && (
            <p className="text-sm text-red-600">Missing tag id. Open via NFC/QR link.</p>
          )}
        </div>

        {!showForm ? (
          <div className="w-full max-w-sm">
            <Button
              onClick={async () => {
                try {
                  const supabase = getBrowserSupabaseClient();
                  const { data: { session } } = await supabase.auth.getSession();
                  if (!session) {
                    await handleGoogleConnect();
                  } else {
                    setShowForm(true);
                  }
                } catch {
                  setShowForm(true);
                }
              }}
              className="w-full py-4 text-lg font-semibold rounded-2xl"
              style={{ backgroundColor: "#8f743c", color: "white" }}
            >
              Get started →
            </Button>
          </div>
        ) : (
          <div className="w-full max-w-sm space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}
            <input
              value={boxCode}
              onChange={(e) => setBoxCode(e.target.value)}
              maxLength={6}
              placeholder="Enter 6-char BOX CODE"
              className="w-full px-4 py-3 rounded-2xl border border-gray-300 bg-white text-center tracking-widest"
            />
            <Button
              onClick={handleVerify}
              disabled={verifying || !tagCode || boxCode.length !== 6}
              className="w-full py-3 text-lg font-semibold rounded-2xl disabled:opacity-50"
              style={{ backgroundColor: "#8f743c", color: "white" }}
            >
              {verifying ? "Verifying..." : verified ? "Verified ✓" : "Verify"}
            </Button>

            <div className="pt-2">
              <Button
                onClick={handleGoogleConnect}
                variant="ghost"
                className="w-full py-4 rounded-2xl border border-gray-300 bg-white"
              >
                Connect with Google
              </Button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
