// components/NavMobileDetails.tsx
"use client";

import Link from "next/link";
import React from "react";


type Props = {
  companyName: string;
  telHref?: string;
  waHref?: string;
};

export default function NavMobileDetails({ companyName, telHref, waHref }: Props) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDetailsElement>(null);

  // Close when clicking outside the panel
  React.useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) {
        ref.current.removeAttribute("open");
        setOpen(false);
      }
    };
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [open]);

  // Close on ESC
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        ref.current?.removeAttribute("open");
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Keep React state in sync with native <details>
  const onToggle = (e: React.SyntheticEvent<HTMLDetailsElement>) => {
    setOpen((e.currentTarget as HTMLDetailsElement).open);
  };

  const close = () => {
    ref.current?.removeAttribute("open");
    setOpen(false);
  };

  const LinkLike = ({
    href,
    children,
    className,
    target,
    rel,
  }: {
    href?: string;
    children: React.ReactNode;
    className?: string;
    target?: string;
    rel?: string;
  }) =>
    href?.startsWith("/") ? (
      <Link href={href} onClick={close} className={className}>
        {children}
      </Link>
    ) : (
      <a href={href || "#"} onClick={close} className={className} target={target} rel={rel}>
        {children}
      </a>
    );

  return (
    <div className="md:hidden">
      <div className="flex items-center justify-between h-16">
        <Link href="/" className="text-xl font-bold text-slate-900">
          {companyName}
        </Link>

        <details ref={ref} onToggle={onToggle} className="relative">
          <summary
            className="list-none cursor-pointer p-2 rounded-lg hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            aria-label={open ? "Close menu" : "Open menu"}
          >
            {/* swap icons purely via React state */}
            {open ? (
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </summary>

          {/* Panel */}
          <div className="absolute right-0 mt-2 w-[88vw] max-w-sm rounded-2xl border border-slate-200 bg-white shadow-xl p-4 animate-in fade-in slide-in-from-top-2">
            <ul className="flex flex-col gap-2">
              <li>
                <a className="px-3 py-3 rounded-lg hover:bg-slate-50" href="#products" onClick={close}>
                  Products
                </a>
              </li>
              <li>
                <a className="px-3 py-3 rounded-lg hover:bg-slate-50" href="#about" onClick={close}>
                  About
                </a>
              </li>
              <li>
                <a className="px-3 py-3 rounded-lg hover:bg-slate-50" href="#faq" onClick={close}>
                  FAQ
                </a>
              </li>
              <li>
                <a className="px-3 py-3 rounded-lg hover:bg-slate-50" href="#contact" onClick={close}>
                  Contact
                </a>
              </li>
            </ul>

            <div className="mt-3 grid grid-cols-2 gap-3">
              <a
                href="#contact"
                onClick={close}
                className="text-center rounded-xl bg-indigo-600 text-white font-semibold py-3 hover:bg-indigo-700"
              >
                Get Quote
              </a>

              <LinkLike
                href={telHref}
                className="text-center rounded-xl border border-blue-400 bg-white text-blue-700 font-semibold py-3 hover:bg-blue-50 aria-disabled:opacity-50"
              >
                Call us
              </LinkLike>

              <LinkLike
                href={waHref}
                className="col-span-2 text-center rounded-xl border border-green-500 bg-green-500/10 text-green-700 font-semibold py-3 hover:bg-green-500/15 aria-disabled:opacity-50"
                target={waHref ? "_blank" : undefined}
                rel={waHref ? "noopener noreferrer" : undefined}
              >
                WhatsApp
              </LinkLike>
            </div>
          </div>
        </details>
      </div>
    </div>
  );
}
