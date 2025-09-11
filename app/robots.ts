// app/robots.ts
import type { MetadataRoute } from "next";

/**
 * Static robots.txt for Vercel:
 * - Uses NEXT_PUBLIC_SITE_URL to build the absolute sitemap URL.
 * - No headers() / async usage (prevents build-time errors).
 */
export default function robots(): MetadataRoute.Robots {
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://landing-page-22.vercel.app")
    .replace(/\/+$/, "");

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/.git/",
          "/.env",
          "/server-status",
          "/ecp/",
          "/actuator/",
          "/*.php$",
          "/*.bak$",
          "/*.sql$",
          "/*.zip$",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    // host: baseUrl, // optional
  };
}
