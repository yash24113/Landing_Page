"use client";

import { useEffect, useState } from "react";

type Props = {};

/** Public env (must point to your about-us endpoint) */
const ABOUTUS_URL = process.env.NEXT_PUBLIC_ABOUTUS_URL as string;

/** Optional auth headers if your API expects them */
const API_KEY = process.env.NEXT_PUBLIC_API_KEY ?? "";
const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? "";
const API_KEY_HEADER = process.env.NEXT_PUBLIC_API_KEY_HEADER ?? "x-api-key";
const ADMIN_EMAIL_HEADER = process.env.NEXT_PUBLIC_ADMIN_EMAIL_HEADER ?? "x-admin-email";

const authHeaders: Record<string, string> = {};
if (API_KEY) authHeaders[API_KEY_HEADER] = API_KEY;
if (ADMIN_EMAIL) authHeaders[ADMIN_EMAIL_HEADER] = ADMIN_EMAIL;

export function CommitmentText(_: Props) {
  const [html, setHtml] = useState<string>("");

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(ABOUTUS_URL, { cache: "no-store", headers: authHeaders });
        if (!res.ok) throw new Error(`AboutUs fetch failed: ${res.status}`);
        const json = await res.json();

        // be flexible about shape
        const obj = json?.data?.aboutUs ?? json?.data ?? json;

        // prefer small → medium → larger; also accept legacy description1/2/3
        const val =
          obj?.descriptionmedium ??
          obj?.descriptionsmall ??
           obj?.descriptionlarger ??
          "Welcome to Amrita! We are passionate about offering reliable solutions that make life smarter and more convenient. With a team driven by creativity and expertise, we focus on quality, customer satisfaction, and long-term trust. At Amrita, our mission is simple—to provide products and services that add real value to your everyday life.";

        const cleaned = typeof val === "string" ? val.trim() : "";
        if (!cancelled) setHtml(cleaned);
      } catch (err) {
        console.error("Error fetching AboutUs:", err);
        if (!cancelled) setHtml("");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // If API gives nothing, render nothing (no hardcoded fallback)
  if (!html) return null;

  return (
    <div
      className="text-base sm:text-lg text-slate-700 leading-relaxed whitespace-pre-wrap break-words"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
