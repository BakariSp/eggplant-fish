import HeaderAuth from "@/components/layout/HeaderAuth";
import Link from "next/link";

export default function SiteHeader() {
  return (
    <header className="pt-5 pb-2 sticky top-0 z-30 safe-x safe-y" style={{ background: "#FCEFDC" }}>
      <div className="mx-auto max-w-[1100px] px-4 sm:px-5 md:px-8 lg:px-12">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-lg font-extrabold tracking-wide" style={{ color: "#2B1F1B" }} aria-label="Go to homepage">
            EGGPLANT.FISH
          </Link>
          <HeaderAuth />
        </div>
        <div className="hairline mt-2" />
      </div>
    </header>
  );
}


