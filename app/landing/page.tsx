"use client";

import Image from "next/image";
import Button from "@/components/ui/Button";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, Suspense } from "react";
import { getBrowserSupabaseClient } from "@/lib/supabase-browser";

function LandingForm() {
  const searchParams = useSearchParams();
  const tagCode = useMemo(() => (searchParams.get("id") || "").trim(), [searchParams]);
  const step = useMemo(() => searchParams.get("step") || "", [searchParams]);
  const router = useRouter();

  const [showForm, setShowForm] = useState(false);
  const [boxCode, setBoxCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState("");

  // Client-side auth guard: if not logged in, redirect to /login with return URL
  useEffect(() => {
    (async () => {
      if (!tagCode) return;
      try {
        const supabase = getBrowserSupabaseClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          const returnTo = `${window.location.origin}/landing?id=${encodeURIComponent(tagCode)}&step=code`;
          router.replace(`/login?redirect=${encodeURIComponent(returnTo)}`);
        }
      } catch {
        // ignore; landing UI will still allow manual login
      }
    })();
  }, [tagCode, router]);

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
        // Save and go to /login, which will handle provider and redirect back
        try {
          sessionStorage.setItem("ef.box_code", boxCode);
          sessionStorage.setItem("pendingActivation", JSON.stringify({ tag_code: tagCode, box_code: boxCode.toUpperCase() }));
        } catch {}
        const redirectTo = `${window.location.origin}/landing?id=${encodeURIComponent(tagCode)}&step=code`;
        router.push(`/login?redirect=${encodeURIComponent(redirectTo)}`);
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
      try { if (boxCode) sessionStorage.setItem("ef.box_code", boxCode); } catch {}
      const redirectTo = `${window.location.origin}/landing?id=${encodeURIComponent(tagCode)}&step=code`;
      router.push(`/login?redirect=${encodeURIComponent(redirectTo)}`);
    } catch {
      // ignore
    }
  };

  return (
    <main className="min-h-screen" style={{ backgroundColor: "#FCEFDC" }}>
      <div className="flex flex-col items-center justify-center px-6 py-12 text-center safe-x safe-y">
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
          <h1 className="text-3xl sm:text-4xl font-bold text-[color:var(--brand-800)] mb-2 leading-tight">
            Welcome to<br />EGGPLANT.FISH
          </h1>
          {tagCode && (
            <p className="text-sm text-[color:var(--brand-800)] opacity-80">Tag: {tagCode}</p>
          )}
          {!tagCode && (
            <div className="text-center">
              <p className="text-sm text-red-600 mb-1">To see portfolio, open via NFC link</p>
              <p className="text-sm">
                <a 
                  href="https://eggplantfish.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-[color:var(--brand-800)] hover:text-[color:var(--brand-700)] underline"
                >
                  To see more product
                </a>
              </p>
            </div>
          )}
        </div>

        {!showForm ? (
          <div className="w-full max-w-sm">
            <Button
              onClick={async () => {
                try {
                  const redirectTo = `${window.location.origin}/landing?id=${encodeURIComponent(tagCode)}&step=code`;
                  router.push(`/login?redirect=${encodeURIComponent(redirectTo)}`);
                } catch {
                  setShowForm(true);
                }
              }}
              size="lg"
              fullWidth
              className="rounded-2xl font-semibold"
            >
              Get started →
            </Button>
          </div>
        ) : (
          <div className="w-full max-w-sm space-y-4 sm:space-y-5">
            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200" role="alert" aria-live="polite">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}
            <input
              value={boxCode}
              onChange={(e) => {
                const next = (e.target.value || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
                setBoxCode(next);
              }}
              inputMode="text"
              autoCapitalize="characters"
              autoCorrect="off"
              enterKeyHint="done"
              pattern="[A-Za-z0-9]{6}"
              aria-label="Enter 6-character box code"
              maxLength={6}
              placeholder="Enter 6-char BOX CODE"
              className="w-full px-4 py-3 rounded-2xl border border-[color:var(--brand-200)] bg-white text-center tracking-widest text-black placeholder:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--brand-600)]"
            />
            <Button
              onClick={handleVerify}
              disabled={verifying || !tagCode || boxCode.length !== 6}
              isLoading={verifying}
              size="lg"
              fullWidth
              className="rounded-2xl font-semibold"
            >
              {verifying ? "Verifying..." : verified ? "Verified ✓" : "Verify"}
            </Button>

            <div className="pt-2">
              <Button
                onClick={handleGoogleConnect}
                variant="ghost"
                size="lg"
                fullWidth
                className="rounded-2xl"
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

export default function LandingPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen" style={{ backgroundColor: "#FCEFDC" }}>
        <div className="flex flex-col items-center justify-center px-6 py-12 text-center safe-x safe-y">
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
            <h1 className="text-3xl sm:text-4xl font-bold text-[color:var(--brand-800)] mb-2">
              Welcome to<br />EGGPLANT.FISH
            </h1>
            <p className="text-sm text-[color:var(--brand-800)] opacity-80">Loading...</p>
          </div>
        </div>
      </main>
    }>
      <LandingForm />
    </Suspense>
  );
}
