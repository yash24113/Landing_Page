// app/sitemap.ts
import type { MetadataRoute } from "next";

/**
 * Revalidate the sitemap every hour. If you need immediate updates,
 * switch to `export const dynamic = "force-dynamic"` and use `cache: "no-store"`
 * in fetch below (higher runtime cost).
 */
export const revalidate = 60 * 60;

/* ---------------------------
   Helpers & Config
---------------------------- */
const getSiteUrl = () =>
  (process.env.NEXT_PUBLIC_SITE_URL || "https://landing-page-22.vercel.app").replace(
    /\/+$/,
    "",
  );

// Backend is ONLY for fetching slugs. Never expose it in <loc>.
const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:7000").replace(
  /\/+$/,
  "",
);

// Optional: static index path for your product listing page
const DEFAULT_PRODUCT_PATH =
  (process.env.NEXT_PUBLIC_DEFAULT_PRODUCT_PATH || "/products").replace(/\/+$/, "") ||
  "/products";

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
  slug?: string; // e.g. "products/micro-interlock-jersey/surat" or "/micro-interlock-jersey"
  updatedAt?: string;
};

/* ---------------------------
   Fetch SEO slugs
---------------------------- */
async function fetchSeoSlugs(): Promise<SeoDoc[]> {
  const url = `${API_BASE}/seo`; // add query params like ?fields=slug,updatedAt if supported
  const res = await fetch(url, {
    headers: buildAuthHeaders(),
    next: { revalidate: 60 * 60 },
    // for immediate freshness instead of ISR:
    // cache: "no-store",
  });
  if (!res.ok) {
    console.error("Sitemap: failed to fetch SEO slugs", res.status, await res.text());
    return [];
  }
  const data = await res.json();
  // Common API shapes
  if (Array.isArray(data)) return data as SeoDoc[];
  if (Array.isArray((data as any)?.data)) return (data as any).data as SeoDoc[];
  return [];
}

/* ---------------------------
   URL utils
---------------------------- */
// Clean a raw path/slug: drop hashes, trim, remove leading slashes.
// If it's a bare slug without "/", mount it under /products/<slug>.
// If it already contains "/", keep as-is (treat as a full path).
function normalizePathFromSlug(raw: string): string {
  const clean = raw.split("#")[0].trim().replace(/^\/+/, "");
  if (!clean) return "";
  return clean.includes("/") ? clean : `products/${clean}`;
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

  // 1) Static must-have entries: Home + product listing
  const entries: MetadataRoute.Sitemap = [
    {
      url: `${base}/`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: collapseDoubleSlashes(
        `${base}${DEFAULT_PRODUCT_PATH.startsWith("/") ? "" : "/"}${DEFAULT_PRODUCT_PATH}`,
      ),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
  ];

  // 2) Dynamic entries from SEO slugs
  const seoDocs = await fetchSeoSlugs();
  const dedupe = new Set<string>();

  for (const doc of seoDocs) {
    const rawSlug = (doc?.slug || "").trim();
    if (!rawSlug) continue;

    const path = normalizePathFromSlug(rawSlug);
    if (!path) continue;

    const loc = collapseDoubleSlashes(`${base}/${path}`);
    const key = `${loc}`; // de-dupe by final URL

    if (dedupe.has(key)) continue;
    dedupe.add(key);

    entries.push({
      url: loc,
      lastModified: doc.updatedAt ? new Date(doc.updatedAt) : now,
      changeFrequency: "weekly",
      priority: 0.7,
    });
  }

  // Safety filter: only absolute http(s) URLs
  const filtered = entries.filter((e) => /^https?:\/\/[^ ]+$/i.test(e.url));

  return filtered;
}
