// components/sticky-contact-button.tsx
"use client";

import { useEffect, useState } from "react";
import { ContactForm } from "@/components/contact-form";
import { X } from "lucide-react";
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
  side?: "left" | "right";   // where to place the FAB; default: left
};

export function StickyContactButton({
  phone,
  email,
  address,
  hours,
  mapsUrl,
  buttonLabel = "Get Your Custom Quote Today",
  title = "Get Your Custom Quote Today",
  subtitle = "",
  side = "left",
}: Props) {
  const [open, setOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Pull from props first, then envs.
  const COMPANY_PHONE = phone || process.env.NEXT_PUBLIC_COMPANY_PHONE || "";
  const COMPANY_EMAIL = email || process.env.NEXT_PUBLIC_COMPANY_EMAIL || "";
  const COMPANY_ADDRESS =
    address || process.env.NEXT_PUBLIC_COMPANY_ADDRESS || "";
  const COMPANY_HOURS = hours || process.env.NEXT_PUBLIC_COMPANY_HOURS || "";

  const telHref = COMPANY_PHONE
    ? `tel:${COMPANY_PHONE.replace(/[^\d+]/g, "")}`
    : undefined;
  const mailHref = COMPANY_EMAIL ? `mailto:${COMPANY_EMAIL}` : undefined;
  const mapsHref =
    mapsUrl ||
    (COMPANY_ADDRESS
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          COMPANY_ADDRESS
        )}`
      : undefined);

  // formatted address
  const addressDisplay = COMPANY_ADDRESS
    ? COMPANY_ADDRESS.replace(/,\s*/g, ",\n")
    : "";

  // Close on Esc + lock scroll
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

  const sideClasses =
    side === "right"
      ? "right-[max(env(safe-area-inset-right),16px)]"
      : "left-[max(env(safe-area-inset-left),16px)]";

  return (
    <>
      {/* Sticky launcher */}
      <div
        className={[
          "fixed z-[120]",
          sideClasses,
          "bottom-[max(env(safe-area-inset-bottom),16px)]",
          "transition-all duration-500 ease-out translate-y-0 opacity-100",
        ].join(" ")}
      >
        {/* tooltip: desktop only */}
        {isHovered && (
          <div
            role="tooltip"
            id="contact-tooltip"
            className={[
              "hidden sm:block absolute bottom-full",
              side === "right" ? "right-0" : "left-0",
              "mb-3 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg whitespace-nowrap",
            ].join(" ")}
          >
            {buttonLabel}
            <div
              className={[
                "w-2 h-2 bg-gray-900 rotate-45 absolute -bottom-1",
                side === "right" ? "right-4" : "left-4",
              ].join(" ")}
            />
          </div>
        )}

        <button
          type="button"
          onClick={() => setOpen(true)}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className={[
            "group relative flex items-center justify-center",
            "w-14 h-14 md:w-16 md:h-16 rounded-full text-white shadow-2xl",
            "transition-all duration-300 hover:scale-110 focus:outline-none",
            "focus-visible:ring-2 focus-visible:ring-white/60",
            "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800",
          ].join(" ")}
          style={{ boxShadow: "0 10px 30px rgba(37,99,235,0.45)" }}
          aria-label={buttonLabel}
          title={buttonLabel}
          aria-describedby={isHovered ? "contact-tooltip" : undefined}
        >
          <span className="sr-only">{buttonLabel}</span>

          {/* ripple (span instead of div) */}
          <span
            className="absolute inset-0 rounded-full bg-white opacity-0 group-hover:opacity-20 group-hover:scale-150 transition-all duration-300"
            aria-hidden="true"
          />

          {/* icon */}
          <span className="text-2xl leading-none relative z-10">✉</span>
        </button>

        {/* reduce motion */}
        <style jsx>{`
          @media (prefers-reduced-motion: reduce) {
            .group:hover {
              transform: none !important;
            }
          }
        `}</style>
      </div>

      {/* Modal */}
      {open && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center"
          role="dialog"
          aria-modal="true"
        >
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
                {subtitle ? (
                  <p className="text-slate-600 mt-1">{subtitle}</p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                aria-label="Close contact form"
              >
                <X className="w-6 h-6 text-slate-500" />
              </button>
            </div>

            {/* Body */}
            <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="p-6 bg-slate-900">
                <div className="grid lg:grid-cols-2 gap-8">
                  <div>
                    <ContactForm onSuccess={() => setOpen(false)} />
                  </div>
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
