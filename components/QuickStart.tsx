"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded border p-4 space-y-3 bg-white">
      <h2 className="text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}

export default function QuickStart() {
  const router = useRouter();
  const [slug, setSlug] = useState("");
  const [setupSlug, setSetupSlug] = useState("");

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Section title="Try a Public Pet Profile">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!slug) return;
            router.push(`/p/${encodeURIComponent(slug)}`);
          }}
          className="flex gap-2"
        >
          <input
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="enter pet slug (e.g. buddy123)"
            className="border rounded px-3 py-2 flex-1"
          />
          <button type="submit" className="px-3 py-2 rounded bg-black text-white">
            View Profile
          </button>
        </form>
        <p className="text-xs text-gray-500">Navigates to /p/[slug]</p>
      </Section>

      <Section title="Setup a New Tag">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!setupSlug) return;
            router.push(`/setup?pid=${encodeURIComponent(setupSlug)}`);
          }}
          className="flex gap-2"
        >
          <input
            value={setupSlug}
            onChange={(e) => setSetupSlug(e.target.value)}
            placeholder="enter pet slug from registration card"
            className="border rounded px-3 py-2 flex-1"
          />
          <button type="submit" className="px-3 py-2 rounded bg-black text-white">
            Start Setup
          </button>
        </form>
        <p className="text-xs text-gray-500">Navigates to /setup?pid=&lt;slug&gt;</p>
      </Section>
    </div>
  );
}


