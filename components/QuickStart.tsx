"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-[color:var(--brand-200)] soft-shadow p-4 md:p-6 space-y-3 bg-white">
      <h2 className="text-lg font-semibold" style={{ color: "var(--brand-700)" }}>{title}</h2>
      {children}
    </section>
  );
}

export default function QuickStart() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [setupCode, setSetupCode] = useState("");

  return (
    <div className="flex flex-col gap-3">
      <Section title="Try a Public Pet Profile">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!code) return;
            router.push(`/p/${encodeURIComponent(code)}`);
          }}
          className="flex gap-2"
        >
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="enter tag code or id"
            className="border rounded-lg px-3 py-2 flex-1 text-black placeholder:text-black focus:outline-none focus:ring-2 focus:ring-[color:var(--brand-300)] focus:font-semibold"
          />
          <button type="submit" className="px-3 py-2 rounded-lg text-white soft-shadow"
            style={{ backgroundColor: "var(--brand-500)" }}>
            View Profile
          </button>
        </form>
        <p className="text-xs text-gray-500">Navigates to /p/[code]</p>
      </Section>

      <Section title="Setup a New Tag">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!setupCode) return;
            router.push(`/setup?pid=${encodeURIComponent(setupCode)}`);
          }}
          className="flex gap-2"
        >
          <input
            value={setupCode}
            onChange={(e) => setSetupCode(e.target.value)}
            placeholder="enter tag code from registration card"
            className="border rounded-lg px-3 py-2 flex-1 text-black placeholder:text-black focus:outline-none focus:ring-2 focus:ring-[color:var(--brand-300)] focus:font-semibold"
          />
          <button type="submit" className="px-3 py-2 rounded-lg text-white soft-shadow"
            style={{ backgroundColor: "var(--brand-500)" }}>
            Start Setup
          </button>
        </form>
        <p className="text-xs text-gray-500">Navigates to /setup?pid=&lt;code&gt;</p>
      </Section>
    </div>
  );
}


