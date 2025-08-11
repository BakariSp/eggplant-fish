export default function Logos() {
  const items = ["Acme", "Umbra", "Logiplum", "Cori", "Luma"];
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-gray-500">
      <span className="mr-1">Trusted by</span>
      {items.map((name) => (
        <span key={name} className="px-2 py-1 rounded border border-[color:var(--brand-200)] bg-white">
          {name}
        </span>
      ))}
    </div>
  );
}


