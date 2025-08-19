import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="w-full sticky top-0 z-20 backdrop-blur bg-white/70 border-b border-[color:var(--brand-100)]">
      <div className="mx-auto max-w-[1100px] px-4 sm:px-5 md:px-8 lg:px-12 h-12 flex items-center justify-between">
        <Link href="/" className="text-sm font-semibold" style={{ color: "var(--brand-800)" }}>
          NFC Pet Tag
        </Link>
        <div className="hidden md:flex gap-5 text-sm text-gray-700">
          <a href="#memories" className="hover:underline">Memories</a>
          <a href="#features" className="hover:underline">Features</a>
          <a href="#reviews" className="hover:underline">Reviews</a>
          <a href="#faq" className="hover:underline">FAQ</a>
        </div>
        <a href="#cta" className="text-sm font-medium px-3 py-1.5 rounded-lg text-white" style={{ backgroundColor: "var(--brand-500)" }}>
          Get Tag
        </a>
      </div>
    </nav>
  );
}


