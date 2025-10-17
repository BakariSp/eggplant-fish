"use client";

import Link from "next/link";
import { useState } from "react";
import Button from "@/components/ui/Button";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  return (
    <nav className="w-full sticky top-0 z-20 bg-white/80 md:backdrop-blur border-b border-[color:var(--brand-100)]">
      <div className="mx-auto max-w-[1100px] px-4 sm:px-5 md:px-8 lg:px-12 h-12 flex items-center justify-between safe-x">
        <Link href="/" className="text-sm font-semibold" style={{ color: "var(--brand-800)" }}>
          NFC Pet Tag
        </Link>
        <div className="hidden md:flex gap-5 text-sm text-gray-700">
          <a href="#memories" className="hover:underline">Memories</a>
          <a href="#features" className="hover:underline">Features</a>
          <a href="#reviews" className="hover:underline">Reviews</a>
          <a href="#faq" className="hover:underline">FAQ</a>
        </div>
        <div className="hidden md:block">
          <Button size="sm" className="px-3 py-1.5">
            Get Tag
          </Button>
        </div>
        <button
          type="button"
          className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-md border border-[color:var(--brand-200)] bg-white text-[color:var(--brand-800)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--brand-600)]"
          aria-label="Toggle menu"
          aria-controls="mobile-menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {open ? (
              <path d="M18 6L6 18M6 6l12 12" />
            ) : (
              <>
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </>
            )}
          </svg>
        </button>
      </div>
      {open && (
        <div className="relative md:hidden">
          <div id="mobile-menu" className="absolute top-0 inset-x-0 bg-white border-b border-[color:var(--brand-100)] z-20">
            <div className="px-4 py-3 flex flex-col gap-2">
              <a href="#memories" className="py-2 text-[color:var(--brand-800)]">Memories</a>
              <a href="#features" className="py-2 text-[color:var(--brand-800)]">Features</a>
              <a href="#reviews" className="py-2 text-[color:var(--brand-800)]">Reviews</a>
              <a href="#faq" className="py-2 text-[color:var(--brand-800)]">FAQ</a>
              <Button fullWidth className="mt-1">Get Tag</Button>
            </div>
          </div>
          <button
            aria-label="Close menu overlay"
            className="fixed inset-0 z-10 bg-black/20"
            onClick={() => setOpen(false)}
          />
        </div>
      )}
    </nav>
  );
}


