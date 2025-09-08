"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

// ---------------------------
// Types
// ---------------------------
type Product = {
  _id: string;
  name: string;
  slug?: string;
  img?: string;
  image1?: string;
  image2?: string;
  productdescription?: string;
};

type IdLike = string | { _id?: string } | null | undefined;

type Seo = {
  _id: string;
  product: IdLike;
  location: IdLike;
  slug: string;
};

type LocationDoc = {
  _id: string;
  name: string;
  slug?: string;
};

// ---------------------------
// API URLs + headers (public)
// ---------------------------
const RAW_BASE = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") ?? "";
const PRODUCT_URL = RAW_BASE ? `${RAW_BASE}/product` : '';
const SEO_URL = RAW_BASE ? `${RAW_BASE}/seo` : '';
const LOC_URL = RAW_BASE ? `${RAW_BASE}/locations` : '';

const API_KEY = process.env.NEXT_PUBLIC_API_KEY ?? "";
const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? "";
const API_KEY_HEADER = process.env.NEXT_PUBLIC_API_KEY_HEADER ?? "";
const ADMIN_EMAIL_HEADER = process.env.NEXT_PUBLIC_ADMIN_EMAIL_HEADER ?? "";

// ---------------------------
// Helpers (same as categories)
// ---------------------------
function normalizeSlug(s: string) {
  return String(s ?? "")
    .toLowerCase()
    .replace(/^\/+|\/+$/g, "")
    .replace(/\?.*$/, "");
}
function getPageSlugFromPath(pathname: string) {
  const clean = normalizeSlug(pathname || "/");
  if (!clean) return "";
  const parts = clean.split("/");
  return parts[parts.length - 1] || "";
}
function extractId(v: IdLike): string {
  if (!v) return "";
  if (typeof v === "string") return v.trim();
  if (typeof v === "object" && v._id) return String(v._id).trim();
  return "";
}

export function Footer() {
  // Company info (public envs)
  const name = process.env.NEXT_PUBLIC_COMPANY_NAME || "";
  const email = process.env.NEXT_PUBLIC_COMPANY_EMAIL || "";
  const phone = process.env.NEXT_PUBLIC_COMPANY_PHONE || "";
  const address = process.env.NEXT_PUBLIC_COMPANY_ADDRESS || "";

  const pathname = usePathname();
  const pageSlug = useMemo(() => getPageSlugFromPath(pathname), [pathname]);

  const [products, setProducts] = useState<Product[]>([]);
  const [seos, setSeos] = useState<Seo[]>([]);
  const [locations, setLocations] = useState<LocationDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all three, same as categories component
  useEffect(() => {
    let alive = true;
    const controller = new AbortController();

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const headers: Record<string, string> = {};
        if (API_KEY) headers[API_KEY_HEADER] = API_KEY;
        if (ADMIN_EMAIL) headers[ADMIN_EMAIL_HEADER] = ADMIN_EMAIL;

        const [seoRes, prodRes, locRes] = await Promise.all([
          fetch(SEO_URL, { headers, signal: controller.signal }),
          fetch(PRODUCT_URL, { headers, signal: controller.signal }),
          fetch(LOC_URL, { headers, signal: controller.signal }),
        ]);

        if (!seoRes.ok) throw new Error(`SEO fetch failed: ${seoRes.status}`);
        if (!prodRes.ok) throw new Error(`Product fetch failed: ${prodRes.status}`);
        if (!locRes.ok) throw new Error(`Locations fetch failed: ${locRes.status}`);

        const seoJson = await seoRes.json();
        const prodJson = await prodRes.json();
        const locJson = await locRes.json();

        if (!alive) return;
        setSeos(Array.isArray(seoJson?.data) ? seoJson.data : []);
        setProducts(Array.isArray(prodJson?.data) ? prodJson.data : []);
        setLocations(Array.isArray(locJson?.data?.locations) ? locJson.data.locations : []);
      } catch (e: any) {
        if (!alive) return;
        setError(e?.message || "Failed to load data");
      } finally {
        if (alive) setLoading(false);
      }
    }

    load();
    return () => {
      alive = false;
      controller.abort();
    };
  }, [pageSlug]);

  // Current SEO (only on slug pages); null on "/"
  const currentSeo = useMemo(() => {
    const slug = pageSlug;
    if (!slug) return null;
    return seos.find((s) => normalizeSlug(s.slug) === slug) || null;
  }, [seos, pageSlug]);

  // Determine target Location ID (same priority as categories)
  const targetLocationId = useMemo(() => {
    if (currentSeo) return extractId(currentSeo.location);

    // home page (no slug) -> prefer "ahmedabad"
    const ahm = locations.find((l) => String(l?.name ?? "").toLowerCase() === "ahmedabad");
    if (ahm?._id) return ahm._id;

    // fallback: first location referenced by any SEO
    for (const s of seos) {
      const id = extractId(s.location);
      if (id) return id;
    }
    return "";
  }, [currentSeo, locations, seos]);

  // Build set of product IDs belonging to the target location
  const targetLocationProductIds = useMemo(() => {
    if (!targetLocationId) return new Set<string>();
    const ids = new Set<string>();
    for (const s of seos) {
      if (extractId(s.location) === targetLocationId) {
        const pid = extractId(s.product);
        if (pid) ids.add(pid);
      }
    }
    return ids;
  }, [seos, targetLocationId]);

  // Map productId -> SEO slug (from any SEO row)
  const productSlugById = useMemo(() => {
    const m = new Map<string, string>();
    for (const s of seos) {
      const pid = extractId(s.product);
      const sl = s.slug?.trim();
      if (pid && sl && !m.has(pid)) m.set(pid, sl);
    }
    return m;
  }, [seos]);

  // Current page's product (if on product slug page)
  const currentProductId = useMemo(() => extractId(currentSeo?.product), [currentSeo]);

  // FINAL LIST for footer: only products in target location (exclude current product), resolve slug via SEO map
  const footerProducts = useMemo(() => {
    if (targetLocationProductIds.size === 0) return [] as Array<{ id: string; name: string; slug?: string }>;

    // in-location products
    const inLocation = products.filter((p) => targetLocationProductIds.has(p._id.trim()));

    // exclude current product (if on a product detail slug)
    const filtered = currentProductId
      ? inLocation.filter((p) => p._id.trim() !== currentProductId)
      : inLocation;

    // Map to {id, name, slug} using SEO slug map; only keep ones with a slug
    const mapped = filtered
      .map((p) => ({
        id: p._id,
        name: p.name,
        slug: productSlugById.get(p._id),
      }))
      .filter((x) => !!x.slug);

    // Deduplicate (in case multiple SEO rows map to same product) & limit
    const seen = new Set<string>();
    const unique: Array<{ id: string; name: string; slug: string }> = [];
    for (const x of mapped) {
      if (!x.slug) continue;
      if (seen.has(x.id)) continue;
      seen.add(x.id);
      unique.push({ id: x.id, name: x.name, slug: x.slug });
      if (unique.length >= 6) break; // show up to 6 links in footer
    }
    return unique;
  }, [products, targetLocationProductIds, currentProductId, productSlugById]);

  // Contact hrefs
  const telHref = phone ? `tel:${phone.replace(/[^\d+]/g, "")}` : undefined;
  const mailHref = email ? `mailto:${email}` : undefined;
  const year = new Date().getFullYear();

  return (
    <footer className="bg-slate-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* --- Company --- */}
          <div className="space-y-4">
            <h3 className="text-2xl font-bold">{name}</h3>
            <p className="text-slate-300 leading-relaxed">
              Leading B2B fabric supplier connecting global manufacturers with premium textiles worldwide.
            </p>
          </div>

          {/* --- Products (dynamic, location-aware) --- */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Products</h4>

            {loading ? (
              <p className="text-slate-400 text-sm">Loading…</p>
            ) : error ? (
              <p className="text-red-400 text-sm">Failed to load: {error}</p>
            ) : footerProducts.length === 0 ? (
              <p className="text-slate-400 text-sm">No products to show.</p>
            ) : (
              <ul className="space-y-2 text-slate-300">
                {footerProducts.map((p) => (
                  <li key={p.id}>
                    <Link href={`/${p.slug}`} className="hover:text-white transition-colors">
                      {p.name}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* --- Services --- */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Services</h4>
            <ul className="space-y-2 text-slate-300">
              <li>Bulk Orders</li>
              <li>Custom Development</li>
              <li>Quality Control</li>
              <li>Global Shipping</li>
            </ul>
          </div>

          {/* --- Contact --- */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Contact</h4>
            <div className="space-y-2 text-slate-300">
              {phone && (
                <p>
                  📞{" "}
                  <a href={telHref} className="hover:text-white transition-colors">
                    {phone}
                  </a>
                </p>
              )}
              {email && (
                <p>
                  ✉️{" "}
                  <a href={mailHref} className="hover:text-white transition-colors">
                    {email}
                  </a>
                </p>
              )}
              {address && <p>🏢 {address}</p>}
            </div>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-slate-400 text-sm">© {year} {name}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
