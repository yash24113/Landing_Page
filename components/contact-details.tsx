// components/contact-details.tsx
// ✅ Server Component with ISR (90 days). No "use client" at the top.

import React from "react";

/* ---------------------------------------------
   ISR settings (90 days)
---------------------------------------------- */
export const revalidate = 60 * 60 * 24 * 90; // 90 days

/* ---------------------------------------------
   API URL + headers
---------------------------------------------- */
const RAW_BASE = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") ?? "";
const OFFICEINFO_URL = RAW_BASE ? `${RAW_BASE}/officeinformation` : "";

const API_KEY = process.env.NEXT_PUBLIC_API_KEY ?? "";
const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? "";
const API_KEY_HEADER =
  process.env.NEXT_API_KEY_HEADER ?? process.env.NEXT_PUBLIC_API_KEY_HEADER ?? "x-api-key";
const ADMIN_EMAIL_HEADER = process.env.NEXT_PUBLIC_ADMIN_EMAIL_HEADER ?? "x-admin-email";

const authHeaders: Record<string, string> = {};
if (API_KEY) authHeaders[API_KEY_HEADER] = API_KEY;
if (ADMIN_EMAIL) authHeaders[ADMIN_EMAIL_HEADER] = ADMIN_EMAIL;

/* ---------------------------------------------
   Types
---------------------------------------------- */
type OfficeInformation = {
  companyName?: string;
  companyPhone1?: string;
  companyPhone2?: string;
  companyEmail?: string;
  companyAddress?: string;
  whatsappNumber?: string;
  companyLogoUrl?: string;
};

/** Minimal phone sanitizer for tel: links */
function sanitizeE164(value: string) {
  if (!value) return "";
  const hasPlus = value.trim().startsWith("+");
  const digits = value.replace(/\D/g, "");
  return hasPlus ? `+${digits}` : digits;
}

/* ---------------------------------------------
   Data fetcher (ISR-enabled)
---------------------------------------------- */
async function getOfficeInfo(): Promise<OfficeInformation | null> {
  if (!OFFICEINFO_URL) return null;

  // ✅ This fetch participates in ISR due to the `next.revalidate` option
  const res = await fetch(OFFICEINFO_URL, {
    headers: authHeaders,
    // 90d revalidation at the request level (works even if this file's export is not read)
    next: { revalidate: 60 * 60 * 24 * 90 },
  });

  if (!res.ok) {
    // You can log for observability if needed
    // console.error("Failed to fetch office info:", res.status, await res.text());
    throw new Error(`Failed to fetch office info: ${res.status}`);
  }

  const json = await res.json();
  const d =
    json?.data?.officeInformation ??
    json?.data ??
    json?.officeInformation ??
    json;

  const picked = Array.isArray(d) ? d[0] : d;
  return (picked as OfficeInformation) || null;
}

/* ---------------------------------------------
   Component (Server)
---------------------------------------------- */
export async function ContactDetails({ className = "" }: { className?: string }) {
  if (!OFFICEINFO_URL) {
    return (
      <p className="text-slate-400 text-sm">
        No API base configured for office information.
      </p>
    );
  }

  let office: OfficeInformation | null = null;
  try {
    office = await getOfficeInfo();
  } catch (e: any) {
    return (
      <p className="text-red-400 text-sm">
        Error: {e?.message || "Error loading office info"}
      </p>
    );
  }

  if (!office) {
    return <p className="text-slate-400 text-sm">No office information available.</p>;
  }

  const name = office.companyName ?? "";
  const phone =
    office.companyPhone1 || office.whatsappNumber || office.companyPhone2 || "";
  const email = office.companyEmail ?? "";
  const address = office.companyAddress ?? "";
  const hours = "Mon–Sat: 10:30 AM – 7:30 PM IST"; // move to DB if needed

  const features = [
    "ISO Certified Quality Standards",
    "Global Shipping & Logistics",
    "Competitive Bulk Pricing",
    "24/7 Customer Support",
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Dark card: Why Choose ... */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-6 rounded-xl text-white">
        <h3 className="text-2xl font-bold mb-4">Why Choose {name}?</h3>
        <ul className="space-y-3">
          {features.map((txt, i) => {
            const dotColors = ["bg-sky-400", "bg-emerald-400", "bg-purple-400", "bg-yellow-400"];
            return (
              <li key={`${txt}-${i}`} className="flex items-center gap-3">
                <span
                  className={`inline-block h-2 w-2 rounded-full ${dotColors[i % dotColors.length]}`}
                />
                <span className="text-sm">{txt}</span>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Contact list */}
      {phone && (
        <div className="truncate md:whitespace-normal text-white">
          📞{" "}
          <a href={`tel:${sanitizeE164(phone)}`} className="hover:underline">
            {phone}
          </a>
        </div>
      )}
      {email && (
        <div className="truncate md:whitespace-normal text-white">
          ✉️{" "}
          <a href={`mailto:${email}`} className="hover:underline">
            {email}
          </a>
        </div>
      )}
      {address && <div className="break-words text-white">🏢 {address}</div>}
      {hours && <div className="text-white">🕘 {hours}</div>}
    </div>
  );
}
