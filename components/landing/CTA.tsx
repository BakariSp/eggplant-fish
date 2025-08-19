import Link from "next/link";

export default function CTA() {
  return (
    <section id="cta" className="py-8">
      <div className="rounded-3xl p-6 md:p-8 bg-[color:var(--brand-50)] border border-[color:var(--brand-200)]">
        <h2 className="text-xl font-bold mb-2" style={{ color: "var(--brand-700)" }}>Ready to start?</h2>
        <p className="text-sm text-gray-700 mb-4">Create a profile and keep your pet’s memories in one cute tag.</p>
        <Link href="#" className="inline-flex items-center px-4 py-2 rounded-lg text-white" style={{ backgroundColor: "var(--brand-500)" }}>
          Get Your NFC Tag
        </Link>
      </div>
    </section>
  );
}


