// app/robots.ts
import type { MetadataRoute } from "next";
import { headers } from "next/headers";

export default function robots(): MetadataRoute.Robots {
  const h = headers();
  const host = h.get("x-forwarded-host") || h.get("host") || "localhost:3000";
  const proto = (h.get("x-forwarded-proto") || (host.startsWith("localhost") ? "http" : "https")).toLowerCase();

  // Prefer an explicit env if you ever set one; otherwise derive from the request
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || `${proto}://${host}`).replace(/\/+$/, "");

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Google/Bing understand * and $ in robots.txt
      disallow: [
        "/.git/",
        "/.env",
        "/*.php$",
        "/server-status",
        "/ecp/",
        "/actuator/",
        "/*.bak$",
        "/*.sql$",
        "/*.zip$",
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
