// app/robots.ts
import type { MetadataRoute } from "next";
import { headers } from "next/headers";

/**
 * Robots:
 * - Always point sitemap to your public site URL (NEXT_PUBLIC_SITE_URL when set).
 * - Derive protocol/host at runtime for previews if env isn't provided.
 */
export default function robots(): MetadataRoute.Robots {
  const h = headers();
  const host = h.get("x-forwarded-host") || h.get("host") || "localhost:3000";
  const proto =
    (h.get("x-forwarded-proto") ||
      (host.startsWith("localhost") ? "http" : "https")).toLowerCase();

  // Prefer explicit public site URL if provided
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || `${proto}://${host}`).replace(
    /\/+$/,
    "",
  );

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Keep common sensitive/system paths out of crawl
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
    // (Optional) You can add host for some crawlers:
    // host: baseUrl,
  };
}
