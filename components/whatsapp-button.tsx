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
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div
      className={[
        "fixed z-[60]",
        "right-[max(env(safe-area-inset-right),16px)]",
        "bottom-[max(env(safe-area-inset-bottom),16px)]",
        "transition-all duration-500 ease-out",
        isVisible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0",
      ].join(" ")}
    >
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
        className="group relative flex items-center justify-center w-14 h-14 md:w-16 md:h-16 rounded-full text-white shadow-2xl transition-all duration-300 hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
        style={{
          boxShadow: "0 10px 30px rgba(34,197,94,0.45)",
          background: "linear-gradient(135deg, #25D366 0%, #128C7E 100%)",
        }}
        aria-label="Open WhatsApp chat"
        title="Open WhatsApp chat"
        aria-describedby={isHovered ? "whatsapp-tooltip" : undefined}
      >
        <span className="sr-only">Open WhatsApp chat</span>

        {/* ripple */}
        <span
          className="absolute inset-0 rounded-full bg-white opacity-0 group-hover:opacity-20 group-hover:scale-150 transition-all duration-300"
          aria-hidden="true"
        />

        {/* icon */}
        <svg
          className="w-6 h-6 md:w-7 md:h-7 relative z-10"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
         <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.149-.669.15-.198.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.149-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.447-.52.149-.174.198-.298.298-.497.099-.198.05-.372-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.58-.487-.5-.669-.51-.173-.008-.372-.01-.57-.01-.198 0-.52.075-.792.372-.272.298-1.04 1.017-1.04 2.48s1.065 2.876 1.213 3.074c.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12.04 2.003c-5.5 0-9.96 4.46-9.96 9.96 0 1.757.46 3.46 1.337 4.96l-1.426 5.218 5.355-1.405c1.455.799 3.086 1.212 4.764 1.212h.001c5.5 0 9.96-4.46 9.96-9.96s-4.46-9.96-9.96-9.96z"></path>

        </svg>

        {/* notification dots */}
        <span
          className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full motion-safe:animate-ping"
          aria-hidden="true"
        />
        <span
          className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full"
          aria-hidden="true"
        />
      </button>
    </div>
  );
}
