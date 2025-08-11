"use client";

import { useTransition } from "react";
import { toggleLostMode } from "@/server/actions/toggleLostMode";

export default function LostModeToggle({ petId, initial }: { petId: string; initial: boolean }) {
  const [isPending, start] = useTransition();
  return (
    <button
      disabled={isPending}
      onClick={() => start(() => { void toggleLostMode({ petId, lostMode: !initial }); })}
      className="px-3 py-2 rounded border"
    >
      {initial ? "Disable Lost Mode" : "Enable Lost Mode"}
    </button>
  );
}


