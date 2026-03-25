"use client";

import Image from "next/image";
import Button from "@/components/ui/Button";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, Suspense } from "react";
import { getBrowserSupabaseClient } from "@/lib/supabase-browser";

// ─── Phase state machine ──────────────────────────────────────────────────────
//
//  "checking"          Async orchestrator running — no interactive UI shown
//  "redirecting"       Router.replace() called — show spinner during navigation
//  "no-tag"            ?id param absent — friendly prompt to scan NFC
//  "invalid-tag"       Tag not found in DB — show error
//  "used-no-pet-owner" Tag claimed, no pet, viewer IS the owner → guide to /setup
//  "used-no-pet-other" Tag claimed, no pet, other/unknown owner → contact support
//  "form"              Tag unused + user logged in → show box code input
//
type Phase =
  | "checking"
  | "redirecting"
  | "no-tag"
  | "invalid-tag"
  | "used-no-pet-owner"
  | "used-no-pet-other"
  | "form";

interface TagStatus {
  exists: boolean;
  isUsed?: boolean;
  hasPet?: boolean;
  isOwner?: boolean;
}

async function fetchTagStatus(tagCode: string): Promise<TagStatus> {
  const res = await fetch(`/api/tag/check?id=${encodeURIComponent(tagCode)}`);
  if (!res.ok) throw new Error(`Tag check failed (${res.status})`);
  return res.json();
}

// ─── Main component ───────────────────────────────────────────────────────────
function LandingForm() {
  const searchParams = useSearchParams();
  const tagCode = useMemo(() => (searchParams.get("id") || "").trim(), [searchParams]);
  const step = useMemo(() => searchParams.get("step") || "", [searchParams]);
  const router = useRouter();

  const [phase, setPhase] = useState<Phase>("checking");
  const [boxCode, setBoxCode] = useState("");
  const [verifyError, setVerifyError] = useState("");
  const [verifying, setVerifying] = useState(false);

  // Stale-result guard: each orchestrate() call gets its own ID.
  // State updates from a superseded run are silently dropped.
  const runId = useRef(0);

  // ── Single orchestrator ───────────────────────────────────────────────────
  // All decision logic lives here. No other useEffect touches routing.
  useEffect(() => {
    const id = ++runId.current;
    const alive = () => id === runId.current;

    async function orchestrate() {
      setPhase("checking");
      setVerifyError("");

      // ── A: No tag code in URL ────────────────────────────────────────────
      if (!tagCode) {
        if (alive()) setPhase("no-tag");
        return;
      }

      // ── B: Fetch tag status (server-side, admin client) ──────────────────
      let status: TagStatus;
      try {
        status = await fetchTagStatus(tagCode);
      } catch {
        if (alive()) setPhase("invalid-tag");
        return;
      }
      if (!alive()) return;

      if (!status.exists) {
        setPhase("invalid-tag");
        return;
      }

      // ── C: Tag already used ──────────────────────────────────────────────
      if (status.isUsed) {
        if (status.hasPet) {
          // Pet page is public — redirect regardless of auth state
          setPhase("redirecting");
          router.replace(`/dashboard/pets/${tagCode}/posts`);
          return;
        }

        // Tag claimed but setup not completed.
        // isOwner from the API is only reliable when the request carried a session
        // cookie (i.e. the user was already logged in). If there is no session we
        // cannot distinguish "owner who hasn't logged in yet" from "someone else",
        // so we must authenticate first and then re-run the decision.
        const supabase = getBrowserSupabaseClient();
        const {
          data: { session: usedSession },
        } = await supabase.auth.getSession();
        if (!alive()) return;

        if (!usedSession) {
          // Not logged in — send to login; returnTo has no step=code so orchestrate
          // re-evaluates the full "used" path after auth, not the box-code path.
          setPhase("redirecting");
          const returnTo = `${window.location.origin}/landing?id=${encodeURIComponent(tagCode)}`;
          router.replace(`/login?redirect=${encodeURIComponent(returnTo)}`);
          return;
        }

        // Logged in — isOwner from the API was evaluated with this same session
        if (alive()) setPhase(status.isOwner ? "used-no-pet-owner" : "used-no-pet-other");
        return;
      }

      // ── D: Tag unused — check auth ───────────────────────────────────────
      const supabase = getBrowserSupabaseClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!alive()) return;

      if (!session) {
        setPhase("redirecting");
        const returnTo = `${window.location.origin}/landing?id=${encodeURIComponent(tagCode)}&step=code`;
        router.replace(`/login?redirect=${encodeURIComponent(returnTo)}`);
        return;
      }

      // Restore box code cached before OAuth redirect (step=code = returning from login)
      if (step === "code") {
        try {
          const cached = sessionStorage.getItem("ef.box_code");
          if (cached && alive()) {
            setBoxCode(cached);
            sessionStorage.removeItem("ef.box_code");
          }
        } catch {
          // sessionStorage may be unavailable in some private-browsing modes
        }
      }

      if (alive()) setPhase("form");
    }

    orchestrate().catch(() => {
      if (alive()) setPhase("invalid-tag");
    });
  }, [tagCode, step, router]);

  // ── Box code verification ─────────────────────────────────────────────────
  const handleVerify = useCallback(async () => {
    if (!tagCode || boxCode.length !== 6 || verifying) return;

    setVerifying(true);
    setVerifyError("");

    try {
      const supabase = getBrowserSupabaseClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        // Token expired mid-flow — persist context and re-authenticate
        try {
          sessionStorage.setItem("ef.box_code", boxCode);
          sessionStorage.setItem(
            "pendingActivation",
            JSON.stringify({ tag_code: tagCode, box_code: boxCode })
          );
        } catch {
          // ignore
        }
        const returnTo = `${window.location.origin}/landing?id=${encodeURIComponent(tagCode)}&step=code`;
        router.replace(`/login?redirect=${encodeURIComponent(returnTo)}`);
        return;
      }

      const res = await fetch("/api/activation/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ tag_code: tagCode, box_code: boxCode }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data?.success) {
        setVerifyError(data?.error || "Verification failed. Please check your code.");
        return;
      }

      router.replace(data?.data?.redirectTo || "/setup");
    } catch (e) {
      setVerifyError(e instanceof Error ? e.message : "Verification failed. Please try again.");
    } finally {
      setVerifying(false);
    }
  }, [tagCode, boxCode, verifying, router]);

  // ── Render ────────────────────────────────────────────────────────────────
  const bg = { backgroundColor: "#FCEFDC" } as const;

  if (phase === "checking" || phase === "redirecting") {
    return (
      <main className="min-h-screen flex items-center justify-center" style={bg}>
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[color:var(--brand-800)]" />
          <p className="text-sm text-[color:var(--brand-800)] opacity-60">
            {phase === "redirecting" ? "Redirecting..." : "Checking tag..."}
          </p>
        </div>
      </main>
    );
  }

  if (phase === "no-tag") {
    return (
      <main className="min-h-screen flex items-center justify-center px-6" style={bg}>
        <div className="w-full max-w-sm text-center space-y-5">
          <Image
            src="/icon/landing-page.svg"
            alt=""
            width={200}
            height={200}
            className="mx-auto"
            priority
          />
          <h1 className="text-2xl font-bold text-[color:var(--brand-800)]">
            Scan Your Pet&apos;s Tag
          </h1>
          <p className="text-sm text-[color:var(--brand-800)] opacity-80">
            Please scan the NFC tag on your pet&apos;s collar to get started.
          </p>
          <a
            href="https://eggplantfish.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block text-sm text-[color:var(--brand-800)] underline opacity-70 hover:opacity-100"
          >
            Learn more about EGGPLANT.FISH →
          </a>
        </div>
      </main>
    );
  }

  if (phase === "invalid-tag") {
    return (
      <main className="min-h-screen flex items-center justify-center px-6" style={bg}>
        <div className="w-full max-w-sm text-center space-y-4">
          <h1 className="text-2xl font-bold text-[color:var(--brand-800)]">Tag Not Recognized</h1>
          <p className="text-sm text-[color:var(--brand-800)] opacity-80">
            We couldn&apos;t find this tag in our system.
            <br />
            Please try scanning again or contact support.
          </p>
          {tagCode && (
            <p className="text-xs text-[color:var(--brand-800)] opacity-40 font-mono">
              Tag: {tagCode}
            </p>
          )}
        </div>
      </main>
    );
  }

  if (phase === "used-no-pet-owner") {
    return (
      <main className="min-h-screen flex items-center justify-center px-6" style={bg}>
        <div className="w-full max-w-sm text-center space-y-5">
          <h1 className="text-2xl font-bold text-[color:var(--brand-800)]">Almost There!</h1>
          <p className="text-sm text-[color:var(--brand-800)] opacity-80">
            Your tag is registered but the pet profile isn&apos;t set up yet.
          </p>
          <Button
            onClick={() => router.replace("/setup")}
            size="lg"
            fullWidth
            className="rounded-2xl font-semibold"
          >
            Complete Setup →
          </Button>
        </div>
      </main>
    );
  }

  if (phase === "used-no-pet-other") {
    return (
      <main className="min-h-screen flex items-center justify-center px-6" style={bg}>
        <div className="w-full max-w-sm text-center space-y-4">
          <h1 className="text-2xl font-bold text-[color:var(--brand-800)]">Tag Already Activated</h1>
          <p className="text-sm text-[color:var(--brand-800)] opacity-80">
            This tag has already been activated.
            <br />
            If you think this is a mistake, please contact our support team.
          </p>
          {tagCode && (
            <p className="text-xs text-[color:var(--brand-800)] opacity-40 font-mono">
              Tag: {tagCode}
            </p>
          )}
        </div>
      </main>
    );
  }

  // phase === "form" — tag unused, user logged in
  return (
    <main className="min-h-screen" style={bg}>
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
            Welcome to
            <br />
            EGGPLANT.FISH
          </h1>
          <p className="text-sm text-[color:var(--brand-800)] opacity-80">Tag: {tagCode}</p>
        </div>

        <div className="w-full max-w-sm space-y-4 sm:space-y-5">
          {verifyError && (
            <div
              className="p-3 rounded-lg bg-red-50 border border-red-200"
              role="alert"
              aria-live="polite"
            >
              <p className="text-red-600 text-sm">{verifyError}</p>
            </div>
          )}

          <input
            value={boxCode}
            onChange={(e) => {
              const next = (e.target.value || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
              setBoxCode(next);
              if (verifyError) setVerifyError("");
            }}
            inputMode="text"
            autoCapitalize="characters"
            autoCorrect="off"
            enterKeyHint="done"
            maxLength={6}
            placeholder="Enter 6-char BOX CODE"
            aria-label="Enter 6-character box code"
            className="w-full px-4 py-3 rounded-2xl border border-[color:var(--brand-200)] bg-white text-center tracking-widest text-black placeholder:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--brand-600)]"
          />

          <Button
            onClick={handleVerify}
            disabled={verifying || boxCode.length !== 6}
            isLoading={verifying}
            size="lg"
            fullWidth
            className="rounded-2xl font-semibold"
          >
            {verifying ? "Verifying..." : "Verify"}
          </Button>
        </div>
      </div>
    </main>
  );
}

// ─── Page wrapper ─────────────────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <Suspense
      fallback={
        <main
          className="min-h-screen flex items-center justify-center"
          style={{ backgroundColor: "#FCEFDC" }}
        >
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[color:var(--brand-800)]" />
        </main>
      }
    >
      <LandingForm />
    </Suspense>
  );
}
