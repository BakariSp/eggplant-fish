"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function HeroCtas() {
  const router = useRouter();
  const [slug, setSlug] = useState("");
  const [setupSlug, setSetupSlug] = useState("");

  return (
    <div className="grid gap-3 md:grid-cols-2 md:gap-4 lg:gap-6">
      <form
        className="flex gap-2 md:gap-3 items-stretch"
        onSubmit={(e) => {
          e.preventDefault();
          if (!slug) return;
          router.push(`/p/${encodeURIComponent(slug)}`);
        }}
      >
        <input
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          placeholder="enter pet slug (e.g. buddy123)"
          className="border rounded-lg px-3 py-2 flex-1 focus:outline-none focus:ring-2 focus:ring-[color:var(--brand-300)]"
        />
        <button
          type="submit"
          className="px-3 py-2 rounded-lg text-white min-w-[112px] md:min-w-[128px]"
          style={{ backgroundColor: "var(--brand-500)" }}
        >
          View Profile
        </button>
      </form>

      <form
        className="flex gap-2 md:gap-3 items-stretch"
        onSubmit={(e) => {
          e.preventDefault();
          if (!setupSlug) return;
          router.push(`/setup?pid=${encodeURIComponent(setupSlug)}`);
        }}
      >
        <input
          value={setupSlug}
          onChange={(e) => setSetupSlug(e.target.value)}
          placeholder="enter pet slug from registration card"
          className="border rounded-lg px-3 py-2 flex-1 focus:outline-none focus:ring-2 focus:ring-[color:var(--brand-300)]"
        />
        <button
          type="submit"
          className="px-3 py-2 rounded-lg text-white min-w-[112px] md:min-w-[128px]"
          style={{ backgroundColor: "var(--brand-500)" }}
        >
          Start Setup
        </button>
      </form>
    </div>
  );
}


