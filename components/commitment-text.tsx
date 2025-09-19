"use client";

import { useEffect, useState } from "react";

type Props = {};

/* ---------------------------------------------
   Config
---------------------------------------------- */
const RAW_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") ??
  "http://localhost:7000/landing";
const ABOUTUS_URL = `${RAW_BASE}/aboutus`;

const API_KEY = process.env.NEXT_PUBLIC_API_KEY ?? "";
const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? "";
const API_KEY_HEADER = process.env.NEXT_PUBLIC_API_KEY_HEADER ?? "x-api-key";
const ADMIN_EMAIL_HEADER = process.env.NEXT_PUBLIC_ADMIN_EMAIL_HEADER ?? "x-admin-email";

const authHeaders: Record<string, string> = {
  "Content-Type": "application/json",
};
if (API_KEY) authHeaders[API_KEY_HEADER] = API_KEY;
if (ADMIN_EMAIL) authHeaders[ADMIN_EMAIL_HEADER] = ADMIN_EMAIL;

/** Safely pick the about-us object from many possible response shape */
function pickAboutObj(json: any): any {
  // Common nests
  const root =
    json?.data?.aboutUs ??
    json?.data?.aboutus ??
    json?.aboutUs ??
    json?.aboutus ??
    json?.data ??
    json;

  // If it's an array, use the first item
  if (Array.isArray(root)) return root[0] ?? null;
  // If it has an "aboutus"/"aboutUs" array inside
  if (Array.isArray(root?.aboutUs)) return root.aboutUs[0] ?? null;
  if (Array.isArray(root?.aboutus)) return root.aboutus[0] ?? null;

  // Otherwise assume it's already the object
  return root ?? null;
}

/** Prefer medium → small → larger → description1/2/3 */
function pickHtml(obj: any): string | null {
  if (!obj || typeof obj !== "object") return null;
  const candidates = [
    obj.descriptionmedium,
    obj.descriptionsmall,
    obj.descriptionlarger,
    obj.description1,
    obj.description2,
    obj.description3,
  ];
  for (const c of candidates) {
    if (typeof c === "string" && c.trim()) return c.trim();
  }
  return null;
}

export function CommitmentText(_: Props) {
  const [html, setHtml] = useState<string>("");

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(ABOUTUS_URL, {
          // NOTE: if you want ISR behavior, remove `no-store` and fetch this on the server instead.
          cache: "no-store",
          headers: authHeaders,
        });
        if (!res.ok) throw new Error(`AboutUs fetch failed: ${res.status}`);
        const json = await res.json();

        const aboutObj = pickAboutObj(json);
        const content = pickHtml(aboutObj) ?? "Demo About Us text";

        if (!cancelled) setHtml(content);
      } catch (err) {
        console.error("Error fetching AboutUs:", err);
        if (!cancelled) setHtml("");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (!html) return null;

  return (
    <div
      className="text-base sm:text-lg text-slate-700 leading-relaxed whitespace-pre-wrap break-words"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
