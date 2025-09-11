// app/robots.ts
import type { MetadataRoute } from "next";
import { headers } from "next/headers";

export default async function robots(): Promise<MetadataRoute.Robots> {
  // Await here ⬇️
  const h = await headers();
  const host =
    h.get("x-forwarded-host") || h.get("host") || "localhost:3000";
  const proto = (
    h.get("x-forwarded-proto") ||
    (host.startsWith("localhost") ? "http" : "https")
  ).toLowerCase();

  // Prefer explicit env over derived host/proto
  const baseUrl = (
    process.env.NEXT_PUBLIC_SITE_URL || `${proto}://${host}`
  ).replace(/\/+$/, "");

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
  };
}
