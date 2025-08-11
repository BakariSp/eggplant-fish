export default function LostAlert({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <div className="bg-red-600 text-white p-3 rounded">{message}</div>
  );
}


