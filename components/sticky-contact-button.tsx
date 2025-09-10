// components/sticky-contact-button.tsx
"use client";

import { useEffect, useState } from "react";
import { ContactForm } from "@/components/contact-form";
import { Phone, Mail, MapPin, Clock, X } from "lucide-react";
import { ContactDetails } from "./contact-details";

type Props = {
  phone?: string;
  email?: string;
  address?: string;
  hours?: string;
  mapsUrl?: string;          // optional: custom Google Maps URL
  buttonLabel?: string;      // tooltip/aria label for the FAB
  title?: string;            // modal title
  subtitle?: string;         // modal subtitle
};

export function StickyContactButton({
  phone,
  email,
  address,
  hours,
  mapsUrl,
  buttonLabel = "",
  title = "Get Your Custom Quote Today",
  subtitle = "",
}: Props) {
  const [open, setOpen] = useState(false);

  // Public env fallbacks
  const COMPANY_PHONE =
    phone || process.env.NEXT_PUBLIC_COMPANY_PHONE || "+91 9925155141";
  const COMPANY_EMAIL =
    email || process.env.NEXT_PUBLIC_COMPANY_EMAIL || "rajesh.goyal@amritafashions.com";
  const COMPANY_ADDRESS =
    address ||
    process.env.NEXT_PUBLIC_COMPANY_ADDRESS ||
    "404, Safal Prelude, Corporate Rd, Prahlad Nagar, Ahmedabad, Gujarat-380015";
  const COMPANY_HOURS =
    hours ||
    process.env.NEXT_PUBLIC_COMPANY_HOURS ||
    "Mon–Sat: 9:30 AM – 7:00 PM IST";

  // Links
  const telHref = `tel:${COMPANY_PHONE.replace(/[^\d+]/g, "")}`;
  const mailHref = `mailto:${COMPANY_EMAIL}`;
  const mapsHref =
    mapsUrl ||
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(COMPANY_ADDRESS)}`;

  // prettified, multiline address for UI
  const addressDisplay = COMPANY_ADDRESS.replace(/,\s*/g, ",\n");

  function sanitizeE164(s: string) {
    return s ? s.replace(/[^\d+]/g, "") : s;
  }

  // Close on Esc + lock scroll when modal is open
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = originalOverflow || "unset";
    };
  }, [open]);

  return (
    <>
      {/* Sticky launcher (bottom-left) */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 left-6 z-[120] bg-gradient-to-r from-blue-600 to-blue-700
                   hover:from-blue-700 hover:to-blue-800 text-white h-14 w-14 rounded-full
                   shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 group"
        aria-label={buttonLabel}
      >
        <span className="text-2xl leading-none">✉</span>
        {/* Tooltip */}
        <span
          className="pointer-events-none absolute -top-2 left-1/2 -translate-x-1/2 -translate-y-full
                     rounded px-2 py-1 text-xs bg-slate-900 text-white opacity-0 group-hover:opacity-100"
        >
          {buttonLabel}
        </span>
      </button>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center" role="dialog" aria-modal="true">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />

          {/* Content */}
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
                <p className="text-slate-600 mt-1">{subtitle}</p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                aria-label="Close contact form"
              >
                <X className="w-6 h-6 text-slate-500" />
              </button>
            </div>

            {/* Body */}
            <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="p-6">
                <div className="grid lg:grid-cols-2 gap-8">
                  <div><ContactForm onSuccess={() => setOpen(false)} /></div>
                  <ContactDetails className="text-black" />
                </div>
              </div>
            </div>
            {/* /Body */}
          </div>
        </div>
      )}
    </>
  );
}
