// components/contact-details.tsx
"use client";

import React from "react";

/** Defaults from env (all optional) */
const BRAND_NAME = process.env.NEXT_PUBLIC_BRAND_NAME || "FabricPro";
const ENV_PHONE = process.env.NEXT_PUBLIC_COMPANY_PHONE || "+91 9925155141";
const ENV_EMAIL = process.env.NEXT_PUBLIC_COMPANY_EMAIL || "rajesh.goyal@amritafashions.com";
const ENV_ADDRESS =
  process.env.NEXT_PUBLIC_COMPANY_ADDRESS ||
  "404, Safal Prelude, Corporate Rd, Prahlad Nagar, Ahmedabad, Gujarat-380015";
const ENV_HOURS = process.env.NEXT_PUBLIC_COMPANY_HOURS || "Mon–Sat: 9:30 AM – 7:00 PM IST";

/** Features: JSON array or comma-separated string via NEXT_PUBLIC_CONTACT_FEATURES */
function envFeatures(): string[] {
  const raw = process.env.NEXT_PUBLIC_CONTACT_FEATURES;
  if (!raw) {
    return [
      "ISO Certified Quality Standards",
      "Global Shipping & Logistics",
      "Competitive Bulk Pricing",
      "24/7 Customer Support",
    ];
  }
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.filter(Boolean).map(String);
  } catch {/* ignore */}
  return raw.split(",").map((s) => s.trim()).filter(Boolean);
}

/** Minimal phone sanitizer for tel: links */
function sanitizeE164(value: string) {
  if (!value) return "";
  const hasPlus = value.trim().startsWith("+");
  const digits = value.replace(/\D/g, "");
  return hasPlus ? `+${digits}` : digits;
}

export type ContactDetailsProps = {
  brandName?: string;
  features?: string[];
  phone?: string;
  email?: string;
  address?: string;
  hours?: string;
  className?: string; // extra wrapper classes if you need spacing tweaks
};

/**
 * ContactDetails
 * - Dark “Why Choose …” card
 * - Simple contact list (phone/email/address/hours)
 */
export function ContactDetails({
  brandName = BRAND_NAME,
  features = envFeatures(),
  phone = ENV_PHONE,
  email = ENV_EMAIL,
  address = ENV_ADDRESS,
  hours = ENV_HOURS,
  className = "",
}: ContactDetailsProps) {
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Dark card: Why Choose ... */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-6 rounded-xl text-white">
        <h3 className="text-2xl font-bold mb-4">Why Choose {brandName}?</h3>
        <ul className="space-y-3">
          {features.map((txt, i) => {
            const dotColors = ["bg-sky-400", "bg-emerald-400", "bg-purple-400", "bg-yellow-400"];
            return (
              <li key={`${txt}-${i}`} className="flex items-center gap-3">
                <span className={`inline-block h-2 w-2 rounded-full ${dotColors[i % dotColors.length]}`} />
                <span className="text-sm">{txt}</span>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Contact list */}
      <div className="truncate md:whitespace-normal  text-white">
        📞{" "}
        <a href={`tel:${sanitizeE164(phone)}`} className="hover:underline">
          {phone}
        </a>
      </div>
      <div className="truncate md:whitespace-normal  text-white">
        ✉️{" "}
        <a href={`mailto:${email}`} className="hover:underline">
          {email}
        </a>
      </div>
      <div className="break-words  text-white">🏢 {address}</div>
      <div className=" text-white">🕘 {hours}</div>
    </div>
  );
}
