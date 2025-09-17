"use client";
import React from "react";
import Link from "next/link";
import { createPortal } from "react-dom";

/* -----------------------------------------------
   Hook: media query (SSR-safe)
------------------------------------------------ */
function useMediaQuery(query: string) {
  const [matches, setMatches] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    // set initial
    setMatches(mql.matches);
    // subscribe
    mql.addEventListener ? mql.addEventListener("change", onChange) : mql.addListener(onChange);
    return () => {
      mql.removeEventListener ? mql.removeEventListener("change", onChange) : mql.removeListener(onChange);
    };
  }, [query]);

  return matches;
}

/* -----------------------------------------------
   Helpers: phone / bidi cleanup
------------------------------------------------ */
const stripBidi = (s: string) => s.replace(/[\u200e\u200f\u202a-\u202e]/g, "").trim();
const sanitizeForTel = (s: string) => {
  const t = stripBidi(s).replace(/"/g, "");
  const plus = t.trim().startsWith("+") ? "+" : "";
  const digits = t.replace(/[^\d]/g, "");
  return `${plus}${digits}`;
};
const sanitizeForWhatsApp = (s: string) => stripBidi(s).replace(/[^0-9]/g, "");

/* -----------------------------------------------
   ENV + Endpoint build (no trailing slash)
------------------------------------------------ */
const RAW_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") ??
  "http://localhost:7000/landing";
const OFFICE_INFO_URL = `${RAW_BASE}/officeinformation`;

/** Optional auth headers if your API expects them */
const API_KEY = process.env.NEXT_PUBLIC_API_KEY ?? "";
const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? "";
const API_KEY_HEADER = process.env.NEXT_PUBLIC_API_KEY_HEADER ?? "x-api-key";
const ADMIN_EMAIL_HEADER = process.env.NEXT_PUBLIC_ADMIN_EMAIL_HEADER ?? "x-admin-email";

const authHeaders: Record<string, string> = {};
if (API_KEY) authHeaders[API_KEY_HEADER] = API_KEY;
if (ADMIN_EMAIL) authHeaders[ADMIN_EMAIL_HEADER] = ADMIN_EMAIL;

export function Navigation() {
  const [open, setOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  const isDesktop = useMediaQuery("(min-width: 768px)"); // Tailwind md breakpoint

  // State from API (with env fallbacks)
  const [companyName, setCompanyName] = React.useState(
    process.env.NEXT_PUBLIC_COMPANY_NAME || "Company Name"
  );
  const [rawPhone, setRawPhone] = React.useState(
    process.env.NEXT_PUBLIC_COMPANY_PHONE || "+91 9925155141"
  );
  const [rawWa, setRawWa] = React.useState(
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || (process.env.NEXT_PUBLIC_COMPANY_PHONE || "+91 9925155141")
  );

  React.useEffect(() => setMounted(true), []);

  // Fetch office information (companyName, phone, WhatsApp)
  React.useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(OFFICE_INFO_URL, {
          headers: authHeaders,
          cache: "no-store",
        });
        if (!res.ok) throw new Error(`Office info fetch failed: ${res.status}`);

        const json = await res.json();
        // expects { data: [ { companyName, companyPhone1, whatsappNumber, ... } ], total: 1 }
        const first = Array.isArray(json?.data) ? json.data[0] : undefined;
        if (!first) return;

        const name = String(first.companyName ?? "").trim();
        const phone = String(first.companyPhone1 ?? first.companyPhone2 ?? "").trim();
        const wa = String(first.whatsappNumber ?? phone ?? "").trim();

        if (cancelled) return;

        if (name) setCompanyName(name);
        if (phone) setRawPhone(phone);
        if (wa) setRawWa(wa);
      } catch (err) {
        // silently fall back to env values
        console.error("Office info fetch error:", err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // 1) Auto-close the mobile menu when we cross to desktop
  React.useEffect(() => {
    if (isDesktop && open) setOpen(false);
  }, [isDesktop, open]);

  // 2) Lock body scroll only when the mobile sheet is visible on mobile
  React.useEffect(() => {
    if (!mounted) return;
    const prevOverflow = document.body.style.overflow;
    const shouldLock = open && !isDesktop; // lock only for mobile sheet
    document.body.style.overflow = shouldLock ? "hidden" : prevOverflow || "";
    return () => {
      document.body.style.overflow = prevOverflow || "";
    };
  }, [open, mounted, isDesktop]);

  // 3) Close on ESC
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const close = () => setOpen(false);

  /* -----------------------------------------------
     Build tel/WA hrefs from fetched (or env) values
  ------------------------------------------------ */
  const telHref = `tel:${sanitizeForTel(rawPhone)}`;
  const waHref = `https://wa.me/${sanitizeForWhatsApp(rawWa)}?text=${encodeURIComponent(
    "Hi! I'm interested in your fabrics and need some assistance."
  )}`;

  // 🔗 CHAT: tell the chatbot to open
  const handleChat = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("chatbot:open"));
    }
    setOpen(false);
  };

  const MenuItem = ({
    href,
    children,
    onClick,
    iconPath,
  }: {
    href: string;
    children: React.ReactNode;
    onClick?: () => void;
    iconPath: string;
  }) => (
    <a
      href={href}
      onClick={() => {
        onClick?.();
        close();
      }}
      className="group relative flex items-center justify-between rounded-xl border border-transparent
                 px-3 py-3 text-slate-800 hover:bg-white hover:border-slate-200 transition-all"
    >
      <span className="inline-flex items-center gap-3">
        <svg className="w-5 h-5 text-slate-500 group-hover:text-slate-700 transition-colors" viewBox="0 0 24 24" fill="none">
          <path d={iconPath} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="font-medium">{children}</span>
      </span>
      <svg
        className="w-5 h-5 text-slate-400 group-hover:text-slate-600 transition-transform group-hover:translate-x-0.5"
        viewBox="0 0 24 24"
        fill="none"
      >
        <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="absolute inset-x-3 bottom-0 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
    </a>
  );

  const overlay = (
    <div className="fixed inset-0 z-[9999] md:hidden">{/* never render on md+ */}
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={close} aria-hidden="true" />

      {/* Decorative glow */}
      <div className="pointer-events-none absolute -top-20 -right-24 h-72 w-72 rounded-full
                      bg-gradient-to-tr from-sky-200/60 via-indigo-100/50 to-transparent blur-3xl" />

      {/* Full-height sheet */}
      <aside role="dialog" aria-modal="true" className="fixed inset-0 bg-gradient-to-b from-white to-slate-50 flex flex-col">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-200">
          <div className="flex items-center justify-between px-5 py-4">
            <span className="text-lg font-semibold text-slate-900">{companyName}</span>
            <button
              aria-label="Close menu"
              className="p-2 rounded-lg hover:bg-slate-100 transition"
              onClick={close}
            >
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="h-[3px] w-full bg-gradient-to-r from-indigo-500 via-sky-400 to-emerald-400" />
        </div>

        {/* Content */}
        <nav className="flex-1 overflow-y-auto p-6">
          <ul className="flex flex-col gap-2">
            <li>
              <MenuItem href="#products" iconPath="M4 6h16M4 12h10M4 18h7">Products</MenuItem>
            </li>
            <li>
              <MenuItem
                href="#about"
                iconPath="M12 12c2.761 0 5-2.239 5-5S14.761 2 12 2 7 4.239 7 7s2.239 5 5 5zm0 2c-3.866 0-7 2.239-7 5v1h14v-1c0-2.761-3.134-5-7-5z"
              >
                About
              </MenuItem>
            </li>
            <li>
              <MenuItem href="#faq" iconPath="M9 9h6M8 13h8M12 19h.01M4 12a8 8 0 1116 0A8 8 0 014 12z">FAQ</MenuItem>
            </li>
            <li>
              <MenuItem
                href="#contact"
                iconPath="M21 10a8.38 8.38 0 01-.9 3.8l-1.1 2.2a2 2 0 01-1.79 1.1H6.79a2 2 0 01-1.79-1.1L3.9 13.8A8.38 8.38 0 013 10a9 9 0 1118 0z"
              >
                Contact
              </MenuItem>
            </li>
          </ul>

          {/* Primary CTA */}
          <div className="mt-4">
            <a
              href="#contact"
              onClick={close}
              className="group block w-full rounded-2xl bg-indigo-600 py-3 text-center font-semibold text-white
                         shadow-sm hover:bg-indigo-700 hover:shadow transition-all"
            >
              <span className="inline-flex items-center gap-2 justify-center">
                <svg className="w-5 h-5 text-white/90" viewBox="0 0 24 24" fill="none">
                  <path d="M3 7h18M5 12h14M8 17h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
                Get Quote
              </span>
            </a>
          </div>

          {/* Quick actions */}
          <div className="mt-4 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handleChat}
              className="flex items-center justify-center gap-2 rounded-xl border border-emerald-500
                         bg-white text-emerald-700 font-semibold py-3 shadow-sm hover:shadow
                         hover:bg-emerald-50 active:scale-[.98] transition-all"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                <path
                  d="M8 10h8M8 14h5M21 12c0 4.418-4.03 8-9 8a9.77 9.77 0 01-3.53-.64L3 20l.64-3.53A8.97 8.97 0 013 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Chat with us
            </button>

            <a
              href="#contact"
              onClick={close}
              className="flex items-center justify-center rounded-xl border border-slate-300 bg-white
                         text-slate-800 font-semibold py-3 shadow-sm hover:shadow hover:bg-slate-50
                         active:scale-[.98] transition-all"
            >
              Contact us
            </a>

            <a
              href={telHref}
              onClick={close}
              className="flex items-center justify-center gap-2 rounded-xl border border-blue-400
                         bg-white text-blue-700 font-semibold py-3 shadow-sm hover:shadow
                         hover:bg-blue-50 active:scale-[.98] transition-all"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 3.15 9.81 19.79 19.79 0 0 1 .08 1.18 2 2 0 0 1 2.05-.99h3a2 2 0 0 1 2 1.72c.12.89.31 1.76.57 2.6a2 2 0 0 1-.45 2.11L6.1 6.91a16 16 0 0 0 7 7l1.47-1.07a2 2 0 0 1 2.11-.45c.84.26 1.71.45 2.6.57A2 2 0 0 1 22 16.92Z" />
              </svg>
              Call us
            </a>

            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              onClick={close}
              className="flex items-center justify-center gap-2 rounded-xl border border-green-500
                         bg-green-500/10 text-green-700 font-semibold py-3 shadow-sm hover:shadow
                         hover:bg-green-500/15 active:scale-[.98] transition-all"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.52 3.48A11.77 11.77 0 0 0 12 0C5.37 0 0 5.37 0 12a11.9 11.9 0 0 0 1.73 6.15L0 24l5.99-1.72A11.95 11.95 0 0 0 12 24c6.63 0 12-5.37 12-12 0-3.17-1.23-6.15-3.48-8.52ZM12 22a10 10 0 0 1-5.1-1.4l-.37-.22-3.56 1.02 1.02-3.47-.24-.38A9.98 9.98 0 1 1 22 12c0 5.52-4.48 10-10 10Zm5.45-7.6c-.3-.16-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.95 1.17-.17.2-.35.22-.65.06-.3-.16-1.26-.46-2.4-1.48-.89-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.62.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.06-.16-.67-1.63-.92-2.23-.24-.58-.49-.5-.67-.5h-.57c-.2 0-.52.08-.8.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.88 1.22 3.08.15.2 2.11 3.22 5.12 4.52.72.31 1.28.5 1.72.64.72.23 1.37.2 1.88.12.58-.09 1.76-.72 2.01-1.43.25-.71.25-1.33.17-1.45-.08-.13-.27-.2-.57-.36Z" />
              </svg>
              WhatsApp
            </a>
          </div>
        </nav>
      </aside>
    </div>
  );

  return (
    <>
      <nav className="bg-white/95 backdrop-blur-sm border-b-0 sticky top-0 z-50 relative animated-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold text-slate-900">
                {companyName}
              </Link>
            </div>

            {/* Desktop */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#products" className="text-slate-700 hover:text-slate-900 font-medium transition-colors">Products</a>
              <a href="#about" className="text-slate-700 hover:text-slate-900 font-medium transition-colors">About</a>
              <a href="#faq" className="text-slate-700 hover:text-slate-900 font-medium transition-colors">FAQ</a>
              <a href="#contact" className="text-slate-700 hover:text-slate-900 font-medium transition-colors">Contact</a>
              <a href="#contact" className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium transition-colors">
                Get Quote
              </a>
            </div>

            {/* Mobile toggle */}
            <div className="md:hidden flex items-center">
              <button
                className={`text-slate-700 hover:text-slate-900 focus:outline-none transition ${open ? "opacity-0 pointer-events-none" : ""}`}
                aria-label={open ? "Close menu" : "Open menu"}
                onClick={() => setOpen(true)}
              >
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Render the mobile sheet only on mobile */}
      {mounted && open && !isDesktop ? createPortal(overlay, document.body) : null}

      <style jsx>{`
        .animated-border::after {
          content: "";
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 4px;
          background: linear-gradient(270deg, #3b82f6, #10b981, #f59e0b, #ef4444, #3b82f6);
          background-size: 400% 400%;
          animation: moveGradient 6s ease infinite;
        }
        @keyframes moveGradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
    </>
  );
}
