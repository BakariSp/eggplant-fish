"use client";

import { useState } from "react";

const faqs = [
  { q: "Do I need an app?", a: "No. Tap the tag or scan the QR — it opens in your browser." },
  { q: "Can I update the profile?", a: "Yes, owners can edit anytime and control what is public." },
  { q: "Does it need charging?", a: "No battery required." },
  { q: "Is my data safe?", a: "We use role-based rules so only owners can modify their pet info." },
];

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="py-6 md:py-10">
      <h2 className="text-xl font-bold mb-4" style={{ color: "var(--brand-700)" }}>FAQ</h2>
      <div className="divide-y divide-[color:var(--brand-200)] rounded-2xl border border-[color:var(--brand-200)] bg-white">
        {faqs.map((f, i) => (
          <div key={f.q}>
            <button
              className="w-full text-left px-4 py-3 font-medium"
              onClick={() => setOpen(open === i ? null : i)}
            >
              {f.q}
            </button>
            {open === i && <div className="px-4 pb-4 text-sm text-gray-700">{f.a}</div>}
          </div>
        ))}
      </div>
    </section>
  );
}


