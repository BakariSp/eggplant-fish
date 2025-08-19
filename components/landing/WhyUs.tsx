export default function WhyUs() {
  const points = [
    { title: "Instant", text: "Open with a tap or scan — no app required." },
    { title: "Secure", text: "Owner controls what the public can see." },
    { title: "Friendly", text: "Cute tags and a warm experience." },
  ];

  return (
    <section className="py-6 md:py-10">
      <h2 className="text-xl font-bold mb-4" style={{ color: "var(--brand-700)" }}>Why Choose Us</h2>
      <div className="grid md:grid-cols-3 gap-4 md:gap-6">
        {points.map((p) => (
          <div key={p.title} className="rounded-2xl border border-[color:var(--brand-200)] bg-white p-5">
            <div className="text-2xl mb-2">❓</div>
            <div className="font-semibold">{p.title}</div>
            <div className="text-sm text-gray-700">{p.text}</div>
          </div>
        ))}
      </div>
    </section>
  );
}


