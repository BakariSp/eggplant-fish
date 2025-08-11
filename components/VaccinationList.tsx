type Vaccine = { id: string; vaccine_name: string; date: string; note?: string | null };

export default function VaccinationList({ items }: { items: Vaccine[] }) {
  if (items.length === 0) return <p className="text-sm text-gray-500">No vaccinations recorded.</p>;
  return (
    <ul className="space-y-2">
      {items.map((v) => (
        <li key={v.id} className="border rounded p-2">
          <div className="font-medium">{v.vaccine_name}</div>
          <div className="text-xs text-gray-600">{new Date(v.date).toLocaleDateString()}</div>
          {v.note ? <div className="text-sm">{v.note}</div> : null}
        </li>
      ))}
    </ul>
  );
}


