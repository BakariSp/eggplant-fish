type PetInfo = {
  vaccinated?: boolean;
  vaccinations?: string[];
  microchip_id?: string;
  allergies?: string[];
  neuter_status?: boolean;
};

type Props = {
  info: PetInfo;
};

export default function PetInfoGrid({ info }: Props) {
  return (
    <div className="grid grid-cols-2 gap-3 mb-6">
      {/* Vaccination Status */}
      <div className="rounded-2xl p-4" style={{ backgroundColor: "#F8E0BC" }}>
        <div className="text-sm font-semibold mb-2" style={{ color: "var(--brand-800)" }}>
          Vaccinated
        </div>
        <div className="space-y-1">
          {info.vaccinations?.map((vaccine) => (
            <div key={vaccine} className="flex items-center text-xs text-gray-700">
              <span className="w-1 h-1 rounded-full bg-[color:var(--brand-500)] mr-2"></span>
              {vaccine}
            </div>
          )) || (
            <div className="text-xs text-gray-600">
              {info.vaccinated ? "Up to date" : "Not vaccinated"}
            </div>
          )}
        </div>
      </div>

      {/* Microchip ID */}
      <div className="rounded-2xl p-4" style={{ backgroundColor: "#F8E0BC" }}>
        <div className="text-sm font-semibold mb-2" style={{ color: "var(--brand-800)" }}>
          Microchip ID
        </div>
        <div className="text-xs font-mono text-gray-700">
          {info.microchip_id || "077077"}
        </div>
      </div>

      {/* Allergies */}
      <div className="rounded-2xl p-4" style={{ backgroundColor: "#F8E0BC" }}>
        <div className="text-sm font-semibold mb-2" style={{ color: "var(--brand-800)" }}>
          Allergies
        </div>
        <div className="space-y-1">
          {info.allergies?.map((allergy) => (
            <div key={allergy} className="flex items-center text-xs text-gray-700">
              <span className="w-1 h-1 rounded-full bg-red-400 mr-2"></span>
              {allergy}
            </div>
          )) || (
            <div className="text-xs text-gray-600">None known</div>
          )}
        </div>
      </div>

      {/* Neuter Status */}
      <div className="rounded-2xl p-4" style={{ backgroundColor: "#F8E0BC" }}>
        <div className="text-sm font-semibold mb-2" style={{ color: "var(--brand-800)" }}>
          Neuter Status
        </div>
        <div className="text-xs text-gray-700">
          {info.neuter_status ? "Neutered" : "Not neutered"}
        </div>
      </div>
    </div>
  );
}
