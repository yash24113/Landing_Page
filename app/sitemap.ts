// app/sitemap.ts
import type { MetadataRoute } from "next";

/** Revalidate every hour */
export const revalidate = 3600;

/* ---------------------------
   Helpers & Config
---------------------------- */
const getSiteUrl = () =>
  (process.env.NEXT_PUBLIC_SITE_URL || "https://landing-page-22.vercel.app")
    .replace(/\/+$/, "");

/* ---------------------------
   Sitemap (only one URL)
---------------------------- */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl();
  const now = new Date();

  // Only one URL entry (homepage or main site)
  return [
    {
      url: `${base}/`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
  ];
}
