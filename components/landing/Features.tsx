export default function Features() {
  const items = [
    { title: "Highlighted Feature 1", desc: "Beautiful profile that tells your pet's story." },
    { title: "Highlighted Feature 2", desc: "Quick Lost Mode and owner contacts." },
    { title: "Highlighted Feature 3", desc: "Posts with photos and vaccine records." },
  ];

  return (
    <section id="features" className="py-6 md:py-10">
      <h2 className="text-xl font-bold mb-4" style={{ color: "var(--brand-700)" }}>Features</h2>
      <div className="grid md:grid-cols-2 gap-4 md:gap-6">
        <div className="rounded-2xl border border-[color:var(--brand-200)] bg-white p-5">
          <h3 className="font-semibold mb-2">{items[0].title}</h3>
          <p className="text-sm text-gray-700">{items[0].desc}</p>
        </div>
        <div className="rounded-2xl border border-[color:var(--brand-200)] bg-white p-5 min-h-[140px]" />
      </div>
      <div className="grid md:grid-cols-3 gap-4 md:gap-6 mt-4">
        {items.slice(1).map((f) => (
          <div key={f.title} className="rounded-2xl border border-[color:var(--brand-200)] bg-white p-5">
            <h3 className="font-semibold mb-2">{f.title}</h3>
            <p className="text-sm text-gray-700">{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}


