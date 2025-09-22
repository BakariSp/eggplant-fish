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
  const otherLinkedContent = emergency?.vet?.name || "";
  
  // 检测是否为纯数字（电话号码）
  const isPhoneNumber = (text: string): boolean => {
    if (!text || text.trim() === '') return false;
    // 移除所有非数字字符（空格、括号、破折号等）
    const cleaned = text.replace(/[\s\-\(\)\+]/g, '');
    // 检查是否只包含数字且长度合理（7-15位）
    return /^\d{7,15}$/.test(cleaned);
  };

  // 检测是否为邮箱格式
  const isEmailAddress = (text: string): boolean => {
    if (!text || text.trim() === '') return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(text);
  };

  // 获取内容类型
  const getContentType = (text: string): 'phone' | 'email' | 'other' => {
    if (!text || text.trim() === '') return 'other';
    
    if (isPhoneNumber(text)) return 'phone';
    if (isEmailAddress(text)) return 'email';
    return 'other';
  };

  const contentType = getContentType(otherLinkedContent);

  return (
    <section className="section-container" style={{ marginTop: '70px' }}>
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
              <a aria-label="Text" href={`sms:${phone}`} className="w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center hover:shadow-lg transition-shadow">
                <svg className="w-7 h-7 text-gray-600" fill="currentColor" stroke="white" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </a>
            ) : null}
            {phone ? (
              <a aria-label="Call" href={`tel:${phone}`} className="w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center hover:shadow-lg transition-shadow">
                <svg className="w-6 h-6 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </a>
            ) : null}
          </div>

          <div>
            <div className="body-text-muted font-medium">Email</div>
            <div className="body-text break-all">{email || "—"}</div>
          </div>
          <div className="flex gap-3 justify-end">
            {email ? (
              <a aria-label="Email" href={`mailto:${email}`} className="w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center hover:shadow-lg transition-shadow">
                <svg className="w-7 h-7 text-gray-600" fill="currentColor" stroke="white" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </a>
            ) : null}
          </div>
        </div>

        <div className="mt-8">
          <div className="section-subtitle mb-2">Other Linked</div>
          <div className="body-text-muted font-medium mb-2">Emergency Doctor</div>
          <div className="grid grid-cols-[1fr_auto] items-center gap-3">
            <div>
              <div className="body-text">{otherLinkedContent || "—"}</div>
            </div>
            <div className="flex gap-3 justify-end">
              {contentType === 'phone' && (
                <a aria-label="Call emergency" href={`tel:${otherLinkedContent}`} className="w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center hover:shadow-lg transition-shadow">
                  <svg className="w-6 h-6 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </a>
              )}
              {contentType === 'email' && (
                <a aria-label="Email emergency" href={`mailto:${otherLinkedContent}`} className="w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center hover:shadow-lg transition-shadow">
                  <svg className="w-7 h-7 text-gray-600" fill="currentColor" stroke="white" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}


