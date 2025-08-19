export default function Reviews() {
  const cards = new Array(4).fill(0).map((_, i) => ({
    name: `User ${i + 1}`,
    text: "This tag helped bring our buddy home fast. The profile and photos are adorable!",
  }));

  return (
    <section id="reviews" className="py-6 md:py-10">
      <h2 className="text-xl font-bold mb-4" style={{ color: "var(--brand-700)" }}>Reviews</h2>
      <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {cards.map((c) => (
          <div key={c.name} className="rounded-2xl border border-[color:var(--brand-200)] bg-white p-5">
            <div className="text-yellow-500 mb-2">★★★★★</div>
            <div className="text-sm text-gray-700">{c.text}</div>
            <div className="mt-2 text-xs text-gray-500">{c.name}</div>
          </div>
        ))}
      </div>
    </section>
  );
}


