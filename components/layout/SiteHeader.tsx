import HeaderAuth from "@/components/layout/HeaderAuth";
import Link from "next/link";

export default function SiteHeader() {
  return (
    <header className="px-4 pt-5 pb-2 sticky top-0 z-30" style={{ background: "#FCEFDC" }}>
      <div className="flex items-center justify-between">
        <Link href="/" className="text-lg font-extrabold tracking-wide" style={{ color: "#2B1F1B" }} aria-label="Go to homepage">
          EGGPLANT.FISH
        </Link>
        <HeaderAuth />
      </div>
      <div className="hairline mt-2" />
    </header>
  );
}


