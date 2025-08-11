import Link from "next/link";
import QuickStart from "@/components/QuickStart";

function PageHeader() {
  return (
    <header className="space-y-1">
      <h1 className="text-2xl font-bold">NFC Pet Tag Platform</h1>
      <p className="text-sm text-gray-600">Scan tags, view public profiles, and manage your pet dashboard.</p>
    </header>
  );
}

function Divider() {
  return <hr className="my-6 border-gray-200" />;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded border p-4 space-y-3 bg-white">
      <h2 className="text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}

export default function Home() {
  return (
    <main className="mx-auto max-w-4xl p-6 space-y-6">
      <PageHeader />
      <QuickStart />
      <Divider />
      <Section title="Owner Dashboard">
        <p className="text-sm text-gray-700">
          Once authenticated, manage your pet at <code className="px-1 py-0.5 bg-gray-100 rounded">/dashboard/pets/[id]</code>.
        </p>
      </Section>
      <Section title="Docs">
        <ul className="list-disc ml-5 text-sm">
          <li>
            <Link className="underline" href="/doc/NFC_Pet_Tag_Development_Guidelines.md">
              Development Guidelines
            </Link>
          </li>
        </ul>
      </Section>
    </main>
  );
}
