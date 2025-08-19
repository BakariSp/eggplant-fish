"use client";

import Image from "next/image";
import SectionHeader from "@/components/ui/SectionHeader";

type Owner = {
  name?: string;
  phone?: string;
  email?: string;
  photo_url?: string;
};

type Emergency = {
  vet?: { name?: string; phone?: string };
};

type Props = {
  owner: Owner | null;
  emergency?: Emergency | null;
};

export default function OwnerInfo({ owner, emergency }: Props) {
  const name = owner?.name || "Unknown Owner";
  const phone = owner?.phone || "";
  const email = owner?.email || "";
  const photo = owner?.photo_url || "/dog.png";
  const vetName = emergency?.vet?.name || "Emergency Doctor";
  const vetPhone = emergency?.vet?.phone || "";

  return (
    <section className="section-container">
      <SectionHeader 
        title="Owner Information" 
        icon="/icon/owner-info.svg"
        variant="default"
      />
      
      <div className="rounded-3xl py-6 px-6 mt-4" style={{ background: "#FAEEDA" }}>
        <div className="flex flex-col items-center text-center">
          <div className="relative w-40 h-40 rounded-full overflow-hidden">
            <Image src={photo} alt={name} fill className="object-cover" />
          </div>
          <div className="mt-3 section-title">{name}</div>
        </div>

        <div className="mt-8 grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-6">
          <div>
            <div className="body-text-muted font-medium">Mobile</div>
            <div className="body-text">{phone || "—"}</div>
          </div>
          <div className="flex gap-3">
            {phone ? (
              <a aria-label="Text" href={`sms:${phone}`} className="w-10 h-10 rounded-full bg-white shadow flex items-center justify-center">💬</a>
            ) : null}
            {phone ? (
              <a aria-label="Call" href={`tel:${phone}`} className="w-10 h-10 rounded-full bg-white shadow flex items-center justify-center">📞</a>
            ) : null}
          </div>

          <div>
            <div className="body-text-muted font-medium">Email</div>
            <div className="body-text break-all">{email || "—"}</div>
          </div>
          <div className="flex gap-3">
            {email ? (
              <a aria-label="Email" href={`mailto:${email}`} className="w-10 h-10 rounded-full bg-white shadow flex items-center justify-center">✉️</a>
            ) : null}
          </div>
        </div>

        <div className="mt-8">
          <div className="section-subtitle mb-2">Other Linked</div>
          <div className="grid grid-cols-[1fr_auto] items-center gap-3">
            <div>
              <div className="body-text">{vetName}</div>
              <div className="body-text">{vetPhone || "—"}</div>
            </div>
            {vetPhone ? (
              <a aria-label="Call emergency" href={`tel:${vetPhone}`} className="w-10 h-10 rounded-full bg-white shadow flex items-center justify-center">📞</a>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}


