// app/sitemap.ts
import type { MetadataRoute } from "next";

/** Must be a static literal so Next can analyze it at build time */
export const revalidate = 3600;

/* ---------------------------
   Helpers & Config
---------------------------- */
const getSiteUrl = () =>
  (process.env.NEXT_PUBLIC_SITE_URL || "https://landing-page-22.vercel.app")
    .replace(/\/+$/, "");

// Backend is ONLY for fetching slugs. Never expose it in <loc>.
const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:7000")
  .replace(/\/+$/, "");

// Optional headers if your API expects them
const API_KEY_HEADER = process.env.NEXT_PUBLIC_API_KEY_HEADER || "x-api-key";
const ADMIN_EMAIL_HEADER = process.env.NEXT_PUBLIC_ADMIN_EMAIL_HEADER || "x-admin-email";
const API_KEY = process.env.NEXT_PUBLIC_API_KEY || "";
const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL || "";

function buildAuthHeaders(): Record<string, string> {
  const h: Record<string, string> = {};
  if (API_KEY) h[API_KEY_HEADER] = API_KEY;
  if (ADMIN_EMAIL) h[ADMIN_EMAIL_HEADER] = ADMIN_EMAIL;
  return h;
}

/* ---------------------------
   Types (adjust to your API)
---------------------------- */
type SeoDoc = {
  slug?: string;      // e.g. "micro-interlock-jersey" OR "products/micro-interlock-jersey/surat"
  updatedAt?: string;
};

/* ---------------------------
   Fetch SEO slugs
---------------------------- */
async function fetchSeoSlugs(): Promise<SeoDoc[]> {
  const res = await fetch(`${API_BASE}/seo`, {
    headers: buildAuthHeaders(),
    next: { revalidate: 3600 }, // keep in sync with top-level revalidate
    // cache: "no-store", // <- enable for instant freshness (no ISR)
  });
  if (!res.ok) {
    console.error("Sitemap: failed to fetch SEO slugs", res.status, await res.text());
    return [];
  }
  const data = await res.json();
  if (Array.isArray(data)) return data as SeoDoc[];
  if (Array.isArray((data as any)?.data)) return (data as any).data as SeoDoc[];
  return [];
}

/* ---------------------------
   URL utils
---------------------------- */
// Keep the slug EXACTLY as your API gives it (no default prefix).
// Strip hashes and leading slashes; allow nested paths.
function normalizePathFromSlug(raw: string): string {
  return raw.split("#")[0].trim().replace(/^\/+/, "");
}

// Collapse accidental double slashes but keep protocol intact (e.g., https://)
function collapseDoubleSlashes(url: string): string {
  return url.replace(/([^:]\/)\/+/g, "$1");
}

/* ---------------------------
   Sitemap Builder
---------------------------- */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl();
  const now = new Date();

  // Only home + dynamic slugs (no default listing path)
  const entries: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
  ];

  const seoDocs = await fetchSeoSlugs();
  const seen = new Set<string>();

  for (const doc of seoDocs) {
    const path = normalizePathFromSlug(doc?.slug || "");
    if (!path) continue;

    const loc = collapseDoubleSlashes(`${base}/${path}`);
    if (seen.has(loc)) continue;
    seen.add(loc);

    entries.push({
      url: loc,
      lastModified: doc?.updatedAt ? new Date(doc.updatedAt) : now,
      changeFrequency: "weekly",
      priority: 0.7,
    });
  }

  // Safety filter: only absolute http(s) URLs
  return entries.filter((e) => /^https?:\/\/[^ ]+$/i.test(e.url));
}
