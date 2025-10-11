"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function HeroCtas() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [setupCode, setSetupCode] = useState("");

  return (
    <div className="flex flex-col gap-3 md:gap-4 w-full max-w-[640px]">
      <form
        className="flex gap-2 md:gap-3 items-stretch"
        onSubmit={(e) => {
          e.preventDefault();
          if (!code) return;
          router.push(`/p/${encodeURIComponent(code)}`);
        }}
      >
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="enter tag code or id"
          className="border rounded-lg px-3 py-2 flex-1 text-black placeholder:text-black focus:outline-none focus:ring-2 focus:ring-[color:var(--brand-300)] focus:font-semibold"
        />
        <button
          type="submit"
          className="px-3 py-2 rounded-lg text-white min-w-[112px] md:min-w-[128px]"
          style={{ backgroundColor: "var(--brand-500)" }}
        >
          View Profile
        </button>
      </form>

      <form
        className="flex gap-2 md:gap-3 items-stretch"
        onSubmit={(e) => {
          e.preventDefault();
          if (!setupCode) return;
          router.push(`/setup?pid=${encodeURIComponent(setupCode)}`);
        }}
      >
        <input
          value={setupCode}
          onChange={(e) => setSetupCode(e.target.value)}
          placeholder="enter tag code from registration card"
          className="border rounded-lg px-3 py-2 flex-1 text-black placeholder:text-black focus:outline-none focus:ring-2 focus:ring-[color:var(--brand-300)] focus:font-semibold"
        />
        <button
          type="submit"
          className="px-3 py-2 rounded-lg text-white min-w-[112px] md:min-w-[128px]"
          style={{ backgroundColor: "var(--brand-500)" }}
        >
          Start Setup
        </button>
      </form>
    </div>
  );
}


