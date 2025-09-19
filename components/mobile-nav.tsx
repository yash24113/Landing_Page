"use client";

import React from "react";
import Link from "next/link";
import { createPortal } from "react-dom";


export default function MobileNav() {
  const [open, setOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  // lock/unlock body scroll
  React.useEffect(() => {
    if (!mounted) return;
    const { style } = document.body;
    const prev = style.overflow;
    style.overflow = open ? "hidden" : prev || "";
    return () => {
      style.overflow = prev || "";
    };
  }, [open, mounted]);

  // close on ESC
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const close = () => setOpen(false);
  const closeAnd = (fn?: () => void) => () => {
    setOpen(false);
    fn?.();
  };

  const overlay = (
    <div className="fixed inset-0 z-[9999]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={close}
        aria-hidden="true"
      />
      {/* Panel */}
      <aside
        role="dialog"
        aria-modal="true"
        className="fixed inset-0 bg-white flex flex-col animate-slide-in"
      >
        <div className="flex items-center justify-between px-4 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Menu</h2>
          <button
            aria-label="Close menu"
            className="p-2 rounded-md hover:bg-slate-100"
            onClick={close}
          >
            <svg
              width="26"
              height="26"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              className="text-slate-700"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto">
          <ul className="flex flex-col gap-1 p-4">
            <li>
              <Link
                href="/"
                onClick={closeAnd()}
                className="block py-3 px-4 rounded-md text-slate-900 font-medium hover:bg-slate-100"
              >
                Home
              </Link>
            </li>
            <li>
              <a
                href="#products"
                onClick={closeAnd()}
                className="block py-3 px-4 rounded-md text-slate-900 font-medium hover:bg-slate-100"
              >
                Products
              </a>
            </li>
            <li>
              <a
                href="#about"
                onClick={closeAnd()}
                className="block py-3 px-4 rounded-md text-slate-900 font-medium hover:bg-slate-100"
              >
                About
              </a>
            </li>
            <li>
              <a
                href="#faq"
                onClick={closeAnd()}
                className="block py-3 px-4 rounded-md text-slate-900 font-medium hover:bg-slate-100"
              >
                FAQ
              </a>
            </li>
            <li>
              <a
                href="#contact"
                onClick={closeAnd()}
                className="block py-3 px-4 rounded-md text-slate-900 font-medium hover:bg-slate-100"
              >
                Con
              </a>
            </li>
            <li className="pt-2">
              <a
                href="#contact"
                onClick={closeAnd()}
                className="block py-3 px-4 rounded-lg bg-blue-600 text-white font-semibold text-center hover:bg-blue-700 transition-colors"
              >
                Get Quote
              </a>
            </li>
          </ul>
        </div>
      </aside>
    </div>
  );

  return (
    <nav className="lg:hidden w-full flex items-center justify-between py-4 px-3 bg-gradient-to-r from-purple-600 to-indigo-600 shadow-md sticky top-0 z-30">
      <Link href="/" className="font-bold text-lg text-white">
        Amrita Global Enterprises
      </Link>

      <button
        aria-label={open ? "Close menu" : "Open menu"}
        aria-controls="mobile-menu"
        aria-expanded={open}
        className="p-2 rounded-md border border-slate-200 bg-white/10 hover:bg-white/20 text-white focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
        onClick={() => setOpen((v) => !v)}
      >
        {open ? (
          // Close icon
          <svg
            width="28"
            height="28"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        ) : (
          // Hamburger
          <svg
            width="28"
            height="28"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        )}
      </button>

      {mounted && open ? createPortal(overlay, document.body) : null}
    </nav>
  );
}
