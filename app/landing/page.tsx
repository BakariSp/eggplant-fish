import Image from "next/image";
import Link from "next/link";
import Button from "@/components/ui/Button";

export default function LandingPage() {
  return (
    <main className="min-h-screen" style={{ backgroundColor: "#FCEFDC" }}>
      {/* Header */}
      <header className="px-6 py-4">
        <div className="text-lg font-bold text-[#8f743c]">
          EGGPLANT.FISH
        </div>
      </header>

      {/* Hero Section */}
      <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
        {/* Hero Illustration */}
        <div className="mb-12 w-full max-w-md">
          <div className="relative w-full max-w-[300px] mx-auto">
            <Image
              src="/icon/landing-page.svg"
              alt="Pet NFC App Hero Illustration"
              width={364}
              height={358}
              className="w-full h-auto"
              priority
            />
          </div>
        </div>

        {/* Welcome Text */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-[#8f743c] mb-4">
            Welcome to<br />EGGPLANT.FISH
          </h1>
        </div>

        {/* Get Started Button */}
        <div className="w-full max-w-sm">
          <Link href="/login">
            <Button 
              className="w-full py-4 text-lg font-semibold rounded-2xl"
              style={{ 
                backgroundColor: "#8f743c",
                color: "white"
              }}
            >
              Get started →
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
