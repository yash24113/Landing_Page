"use client";

import { useEffect, useState } from "react";

export function WhatsAppButton() {
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setIsVisible(true), 600);
    return () => clearTimeout(t);
  }, []);

  const handleWhatsAppClick = () => {
    const message = encodeURIComponent(
      "Hi! 👋 I'm interested in your fabric products. Could you please provide me with your collection, pricing, and MOQs?"
    );
    const phoneNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "";
    const base = "https://wa.me";
    const path = phoneNumber ? `/${phoneNumber}` : "/";
    const whatsappUrl = `${base}${path}?text=${message}`;
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <>
      <div
        className={[
          "fixed z-[60]",
          // bottom/right with iOS safe areas
          "right-[max(env(safe-area-inset-right),16px)]",
          "bottom-[max(env(safe-area-inset-bottom),16px)]",
          // slide in
          "transition-all duration-500 ease-out",
          isVisible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0",
        ].join(" ")}
      >
        {/* tooltip: desktop only */}
        {isHovered && (
          <div
            role="tooltip"
            id="whatsapp-tooltip"
            className="hidden sm:block absolute bottom-full right-0 mb-3 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg whitespace-nowrap"
          >
            Chat with us on WhatsApp
            <div className="w-2 h-2 bg-gray-900 rotate-45 absolute -bottom-1 right-4" />
          </div>
        )}

        <button
          type="button"
          onClick={handleWhatsAppClick}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className="group relative inline-flex items-center justify-center w-14 h-14 md:w-16 md:h-16 rounded-full text-white shadow-2xl transition-all duration-300 hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
          style={{
            boxShadow: "0 10px 30px rgba(34,197,94,0.45)",
            background: "linear-gradient(135deg, #25D366 0%, #128C7E 100%)",
          }}
          aria-label="Open WhatsApp chat"
          title="Open WhatsApp chat"
          aria-describedby={isHovered ? "whatsapp-tooltip" : undefined}
        >
          <span className="sr-only">Open WhatsApp chat</span>

          {/* ripple (use span, phrasing content) */}
          <span
            className="pointer-events-none absolute inset-0 rounded-full bg-white opacity-0 group-hover:opacity-20 group-hover:scale-150 transition-all duration-300"
            aria-hidden="true"
          />

          {/* icon */}
          <svg
            className="w-6 h-6 md:w-7 md:h-7 relative z-10"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
            focusable="false"
          >
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.74-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884" />
          </svg>

          {/* notification dots (use span, phrasing content) */}
          <span
            className="pointer-events-none absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full motion-safe:animate-ping"
            aria-hidden="true"
          />
          <span
            className="pointer-events-none absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full"
            aria-hidden="true"
          />
        </button>
      </div>

      {/* motion preferences */}
      <style jsx>{`
        @media (prefers-reduced-motion: reduce) {
          .group:hover {
            transform: none !important;
          }
        }
      `}</style>
    </>
  );
}
