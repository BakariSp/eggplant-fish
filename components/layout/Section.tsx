type Props = { title?: string; children: React.ReactNode; id?: string };

export default function Section({ title, children, id }: Props) {
  return (
    <section id={id} className="py-6 md:py-8">
      {title ? (
        <h2 className="text-xl font-bold mb-3" style={{ color: "var(--brand-700)" }}>
          {title}
        </h2>
      ) : null}
      {children}
    </section>
  );
}


