"use client";

import { useState } from "react";
import { toggleLostMode } from "@/server/actions/toggleLostMode";

type Emergency = {
  vet?: { name: string; phone: string };
  lost_mode?: { active: boolean; message?: string };
};

type Props = {
  petId: string;
  emergency: Emergency | null;
  onUpdate?: () => void;
};

export default function EmergencyPanel({ petId, emergency, onUpdate }: Props) {
  const [isToggling, setIsToggling] = useState(false);

  const handleLostModeToggle = async () => {
    setIsToggling(true);
    try {
      const result = await toggleLostMode({
        petId,
        lostMode: !emergency?.lost_mode?.active,
        lostMessage: emergency?.lost_mode?.message || "Please contact owner if found!",
      });
      
      if (result.ok) {
        onUpdate?.();
      } else {
        alert(`Error: ${result.reason}`);
      }
    } catch {
      alert("Failed to update lost mode");
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <section className="rounded-2xl border border-[color:var(--brand-200)] soft-shadow p-4 bg-white">
      <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--brand-700)" }}>
        Emergency Information
      </h2>
      
      <div className="divide-y divide-[color:var(--brand-100)]">
        <div className="flex items-center justify-between py-3">
          <div>
            <div className="text-sm font-medium">Veterinarian</div>
            <div className="text-xs text-gray-600">{emergency?.vet?.name ?? "Not set"}</div>
          </div>
          <div className="text-sm text-right">
            {emergency?.vet?.phone ? (
              <a href={`tel:${emergency.vet.phone}`} className="text-[color:var(--brand-700)] underline">
                {emergency.vet.phone}
              </a>
            ) : (
              "—"
            )}
          </div>
        </div>
        
        <div className="flex items-center justify-between py-3">
          <div>
            <div className="text-sm font-medium">Lost Mode</div>
            <div className="text-xs text-gray-600">
              {emergency?.lost_mode?.active ? (
                <span className="text-red-600">🚨 Active</span>
              ) : (
                <span className="text-green-600">✅ Safe</span>
              )}
            </div>
          </div>
          <div className="text-sm text-right max-w-[120px] truncate">
            {emergency?.lost_mode?.message || (emergency?.lost_mode?.active ? "Call if found!" : "")}
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-2 pt-3">
        {emergency?.vet?.phone && (
          <a
            href={`tel:${emergency.vet.phone}`}
            className="w-full rounded-lg border border-[color:var(--brand-300)] py-2 bg-white text-center text-sm hover:bg-[color:var(--brand-50)]"
          >
            📞 Call Vet
          </a>
        )}
        <button
          onClick={() => {
            const url = `${window.location.origin}/p/${petId}`;
            navigator.clipboard.writeText(url);
            alert("Profile link copied!");
          }}
          className="w-full rounded-lg border border-[color:var(--brand-300)] py-2 bg-white text-sm hover:bg-[color:var(--brand-50)]"
        >
          🔗 Share Profile
        </button>
        <button
          onClick={handleLostModeToggle}
          disabled={isToggling}
          className="w-full rounded-lg text-white py-2 soft-shadow text-sm disabled:opacity-50"
          style={{
            backgroundColor: emergency?.lost_mode?.active ? "var(--brand-600)" : "var(--brand-800)"
          }}
        >
          {isToggling ? "Updating..." : emergency?.lost_mode?.active ? "🏠 Mark Found" : "🚨 Report Lost"}
        </button>
      </div>
    </section>
  );
}
