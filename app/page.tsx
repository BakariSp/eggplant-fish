import Link from "next/link";
import Image from "next/image";
import HeroCtas from "@/components/HeroCtas";
import Logos from "@/components/landing/Logos";

function PageHeader() {
  return (
    <header className="space-y-3 text-center md:text-left">
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[color:var(--brand-100)] text-[color:var(--brand-800)] text-xs font-medium">
        Eggplant.Fish
        <span className="w-1.5 h-1.5 rounded-full bg-[color:var(--brand-500)]" />
        NFC Pet Tag
      </div>
      <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight" style={{ color: "var(--brand-800)" }}>
        Caring, Cute, and Quick to Help Pets Home
      </h1>
      <p className="text-sm md:text-base text-gray-600 max-w-2xl">
        Scan a tag to see a pet’s profile, contact their owner, or toggle Lost Mode. Built for mobile-first
        rescue moments.
      </p>
    </header>
  );
}

function Divider() {
  return <hr className="my-8 border-[color:var(--brand-200)]" />;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl soft-shadow p-5 space-y-3 bg-white border border-[color:var(--brand-100)]">
      <h2 className="text-lg font-semibold" style={{ color: "var(--brand-700)" }}>
        {title}
      </h2>
      {children}
    </section>
  );
}

export default function Home() {
  return (
    <main className="mx-auto max-w-[1100px] px-4 sm:px-5 md:px-8 lg:px-12 py-5 md:py-8 space-y-10 brand-gradient min-h-[100svh] safe-x safe-y">
      {/* Hero */}
      <div className="grid md:grid-cols-2 gap-6 md:gap-10 items-center">
        <div className="space-y-4">
          <PageHeader />
          <HeroCtas />
          <Logos />
        </div>
        <div className="relative aspect-[4/3] w-full rounded-2xl overflow-hidden border border-[color:var(--brand-200)] soft-shadow">
          <Image src="/main.jpg" alt="Cute NFC pet tags" fill className="object-cover" priority />
        </div>
      </div>

      {/* Pet Memories section */}
      <section className="space-y-3">
        <h2 className="text-xl font-bold" style={{ color: "var(--brand-700)" }}>Store Your Pet’s Memories</h2>
        <p className="text-sm text-gray-700">
          Each NFC tag is a living scrapbook. Add photos, stories, and vaccination records so anyone who
          scans can help and celebrate your pet.
        </p>
        <ul className="text-sm text-gray-700 list-disc ml-5 grid gap-1">
          <li>Profile with avatar, name, breed, birthday</li>
          <li>Pet blog posts with up to 3 photos</li>
          <li>Vaccination records and allergy notes</li>
        </ul>
      </section>

      {/* Product info */}
      <section className="space-y-3">
        <h2 className="text-xl font-bold" style={{ color: "var(--brand-700)" }}>How the NFC Tag Works</h2>
        <p className="text-sm text-gray-700">
          Tap the tag with a phone or scan the QR to open the pet profile instantly. Lost Mode shows a clear
          banner and contact options chosen by the owner.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 lg:gap-3 text-xs text-gray-600">
          <div className="rounded-xl p-3 bg-white border border-[color:var(--brand-200)] text-center">Water-resistant</div>
          <div className="rounded-xl p-3 bg-white border border-[color:var(--brand-200)] text-center">Lightweight</div>
          <div className="rounded-xl p-3 bg-white border border-[color:var(--brand-200)] text-center">No battery</div>
        </div>
      </section>

      {/* Support */}
      <section className="space-y-3">
        <h2 className="text-xl font-bold" style={{ color: "var(--brand-700)" }}>Support</h2>
        <p className="text-sm text-gray-700">Questions or feedback? We’re happy to help.</p>
        <ul className="text-sm">
          <li>Email: <a className="underline text-[color:var(--brand-700)]" href="mailto:support@example.com">support@example.com</a></li>
          <li>Docs: <Link className="underline text-[color:var(--brand-700)]" href="/doc/NFC_Pet_Tag_Development_Guidelines.md">Development Guidelines</Link></li>
        </ul>
      </section>

      <footer className="text-xs text-gray-500 text-center pt-4">
        © {new Date().getFullYear()} NFC Pet Tag. Crafted with
        <span className="mx-1 text-[color:var(--brand-600)]">♥</span>
        for pets and people.
      </footer>
    </main>
  );
}
