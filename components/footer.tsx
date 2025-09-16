"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

/* ---------------------------------------------
   Config
---------------------------------------------- */
const DEFAULT_LOCATION_SLUG = "ahmedabad";

/* ---------------------------------------------
   Types
---------------------------------------------- */
type Product = { _id: string; name: string; slug?: string };
type IdLike = string | { _id?: string } | null | undefined;
type Seo = { _id: string; product: IdLike; location: IdLike; slug: string; locationCode?: string };
type LocationDoc = { _id: string; name: string; slug?: string };
type OfficeInformation = {
  _id?: string;
  companyName?: string;
  companyPhone1?: string;
  companyPhone2?: string;
  companyEmail?: string;
  companyAddress?: string;
  whatsappNumber?: string;
  companyLogoUrl?: string;
};

/* ---------------------------------------------
   API URLs + headers (public)
---------------------------------------------- */
const RAW_BASE = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") ?? "";
const PRODUCT_URL = RAW_BASE ? `${RAW_BASE}/product` : "";
const SEO_URL = RAW_BASE ? `${RAW_BASE}/seo` : "";
const LOC_URL = RAW_BASE ? `${RAW_BASE}/locations` : "";
const OFFICEINFO_URL = RAW_BASE ? `${RAW_BASE}/officeinformation` : "";

const API_KEY = process.env.NEXT_PUBLIC_API_KEY ?? "";
const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? "";
const API_KEY_HEADER = process.env.NEXT_API_KEY_HEADER ?? "x-api-key";
const ADMIN_EMAIL_HEADER = process.env.NEXT_PUBLIC_ADMIN_EMAIL_HEADER ?? "x-admin-email";

/* ---------------------------------------------
   Helpers
---------------------------------------------- */
const norm = (s: any) => String(s ?? "").trim().toLowerCase();
const normalizeSlug = (s: string) => String(s ?? "").toLowerCase().replace(/^\/+|\/+$/g, "").replace(/\?.*$/, "");
const getPageSlugFromPath = (pathname: string) => {
  const clean = normalizeSlug(pathname || "/");
  if (!clean) return "";
  const parts = clean.split("/");
  return parts[parts.length - 1] || "";
};
function extractId(v: IdLike): string {
  if (!v) return "";
  if (typeof v === "string") return v.trim();
  if (typeof v === "object" && v._id) return String(v._id).trim();
  return "";
}
function isSeoForLocation(seoRow: Partial<Seo>, locIds: Set<string>, locSlug: string) {
  const id = extractId(seoRow.location);
  const code = norm(seoRow.locationCode);
  const okById = id && locIds.has(id);
  const okByCode = locSlug && code === norm(locSlug);
  return !!(okById || okByCode);
}
/** strict extractor — expects object or first array item; no env fallbacks */
function pickOfficeInfo(payload: any): OfficeInformation | null {
  const d =
    payload?.data?.officeInformation ??
    payload?.data ??
    payload?.officeInformation ??
    payload;

  if (!d) return null;
  if (Array.isArray(d)) return d[0] ?? null;
  if (typeof d === "object") return d as OfficeInformation;
  return null;
}

/* ---------------------------------------------
   Footer (DB-only for company details)
---------------------------------------------- */
export function Footer() {
  const pathname = usePathname();
  const pageSlug = useMemo(() => getPageSlugFromPath(pathname), [pathname]);

  const [products, setProducts] = useState<Product[]>([]);
  const [seos, setSeos] = useState<Seo[]>([]);
  const [locations, setLocations] = useState<LocationDoc[]>([]);
  const [officeInfo, setOfficeInfo] = useState<OfficeInformation | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

        const [seoRes, prodRes, locRes, officeRes] = await Promise.all([
          fetch(SEO_URL, { headers, signal: controller.signal }),
          fetch(PRODUCT_URL, { headers, signal: controller.signal }),
          fetch(LOC_URL, { headers, signal: controller.signal }),
          fetch(OFFICEINFO_URL, { headers, signal: controller.signal }),
        ]);

        if (!seoRes.ok) throw new Error(`SEO fetch failed: ${seoRes.status}`);
        if (!prodRes.ok) throw new Error(`Product fetch failed: ${prodRes.status}`);
        if (!locRes.ok) throw new Error(`Locations fetch failed: ${locRes.status}`);
        if (!officeRes.ok) throw new Error(`OfficeInfo fetch failed: ${officeRes.status}`);

        const [seoJson, prodJson, locJson, officeJson] = await Promise.all([
          seoRes.json(),
          prodRes.json(),
          locRes.json(),
          officeRes.json(),
        ]);

        if (!alive) return;
        setSeos(Array.isArray(seoJson?.data) ? seoJson.data : []);
        setProducts(Array.isArray(prodJson?.data) ? prodJson.data : []);
        const rawLocs = (locJson?.data?.locations ?? locJson?.data ?? locJson?.locations) ?? [];
        setLocations(Array.isArray(rawLocs) ? rawLocs : []);
        setOfficeInfo(pickOfficeInfo(officeJson));
      } catch (e: any) {
        if (!alive) return;
        setError(e?.message || "Failed to load data");
      } finally {
        if (alive) setLoading(false);
      }
    }

    if (SEO_URL && PRODUCT_URL && LOC_URL && OFFICEINFO_URL) load();
    else {
      setLoading(false);
      setError("Missing API base URL");
    }

    return () => {
      alive = false;
      controller.abort();
    };
  }, [pageSlug]);

  // location-aware product list (unchanged logic)
  const currentSeo = useMemo(() => {
    const slug = pageSlug;
    if (!slug) return null;
    return seos.find((s) => normalizeSlug(s.slug) === slug) || null;
  }, [seos, pageSlug]);

  const targetLocIds = useMemo(() => {
    const ids = new Set<string>();
    const fromSeoId = extractId(currentSeo?.location);
    if (fromSeoId) ids.add(fromSeoId);
    if (ids.size === 0) {
      for (const l of locations) {
        if (norm(l?.name) === DEFAULT_LOCATION_SLUG || norm(l?.slug) === DEFAULT_LOCATION_SLUG) {
          if (l._id) ids.add(l._id);
        }
      }
    }
    if (ids.size === 0) {
      for (const s of seos) {
        const cand = extractId(s.location);
        if (cand) {
          ids.add(cand);
          break;
        }
      }
    }
    return ids;
  }, [currentSeo, locations, seos]);

  const targetLocCode = useMemo(() => (currentSeo?.locationCode ? norm(currentSeo.locationCode) : DEFAULT_LOCATION_SLUG), [currentSeo]);

  const targetLocationProductIds = useMemo(() => {
    if (targetLocIds.size === 0 && !targetLocCode) return new Set<string>();
    const ids = new Set<string>();
    for (const s of seos) {
      if (isSeoForLocation(s, targetLocIds, targetLocCode)) {
        const pid = extractId(s.product);
        if (pid) ids.add(pid);
      }
    }
    return ids;
  }, [seos, targetLocIds, targetLocCode]);

  const productSlugById = useMemo(() => {
    const m = new Map<string, string>();
    for (const s of seos) {
      const pid = extractId(s.product);
      const sl = s.slug?.trim();
      if (!pid || !sl) continue;
      if (isSeoForLocation(s, targetLocIds, targetLocCode)) m.set(pid, sl);
    }
    for (const s of seos) {
      const pid = extractId(s.product);
      const sl = s.slug?.trim();
      if (pid && sl && !m.has(pid)) m.set(pid, sl);
    }
    return m;
  }, [seos, targetLocIds, targetLocCode]);

  const currentProductId = useMemo(() => extractId(currentSeo?.product), [currentSeo]);

  const footerProducts = useMemo(() => {
    if (targetLocationProductIds.size === 0) return [] as Array<{ id: string; name: string; slug?: string }>;
    const inLocation = products.filter((p) => targetLocationProductIds.has(p._id.trim()));
    const filtered = currentProductId ? inLocation.filter((p) => p._id.trim() !== currentProductId) : inLocation;
    const mapped = filtered.map((p) => {
      const seoSlug = productSlugById.get(p._id);
      const finalSlug = (seoSlug || p.slug || "").trim();
      return { id: p._id, name: p.name, slug: finalSlug || undefined };
    });
    const seen = new Set<string>();
    const unique: Array<{ id: string; name: string; slug?: string }> = [];
    for (const x of mapped) {
      if (seen.has(x.id)) continue;
      seen.add(x.id);
      unique.push(x);
      if (unique.length >= 6) break;
    }
    return unique;
  }, [products, targetLocationProductIds, currentProductId, productSlugById]);

  /* ---------------------------------------------
     STRICT company details (DB only)
  ---------------------------------------------- */
  const companyName = officeInfo?.companyName?.trim() ?? "";
  const companyEmail = officeInfo?.companyEmail?.trim() ?? "";
  const primaryPhone =
    officeInfo?.companyPhone1?.trim() ||
    officeInfo?.whatsappNumber?.trim() ||
    officeInfo?.companyPhone2?.trim() ||
    ""; // stays empty if API doesn’t provide
  const companyAddress = officeInfo?.companyAddress?.trim() ?? "";

  const telHref = primaryPhone ? `tel:${primaryPhone.replace(/[^\d+]/g, "")}` : undefined;
  const mailHref = companyEmail ? `mailto:${companyEmail}` : undefined;
  const year = new Date().getFullYear();

  return (
    <footer className="bg-slate-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company */}
          <div className="space-y-4">
            <h3 className="text-2xl font-bold">
              {loading ? "Loading…" : companyName || "—"}
            </h3>
            <p className="text-slate-300 leading-relaxed">
              Leading B2B fabric supplier connecting global manufacturers with premium textiles worldwide.
            </p>
            {error && <p className="text-red-400 text-sm">Failed to load: {error}</p>}
          </div>

          {/* Products (location-aware) */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Products</h4>
            {loading ? (
              <p className="text-slate-400 text-sm">Loading…</p>
            ) : footerProducts.length === 0 ? (
              <p className="text-slate-400 text-sm">No products to show.</p>
            ) : (
              <ul className="space-y-2 text-slate-300">
                {footerProducts.map((p) => (
                  <li key={p.id}>
                    {p.slug ? (
                      <Link href={`/${p.slug}`} className="hover:text-white transition-colors">
                        {p.name}
                      </Link>
                    ) : (
                      <span className="opacity-80">{p.name}</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Services */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Services</h4>
            <ul className="space-y-2 text-slate-300">
              <li>Bulk Orders</li>
              <li>Custom Development</li>
              <li>Quality Control</li>
              <li>Global Shipping</li>
            </ul>
          </div>

          {/* Contact (render only when API provides each field) */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Contact</h4>
            <div className="space-y-2 text-slate-300">
              {primaryPhone && (
                <p>
                  📞{" "}
                  <a href={telHref} className="hover:text-white transition-colors">
                    {primaryPhone}
                  </a>
                </p>
              )}
              {companyEmail && (
                <p>
                  ✉️{" "}
                  <a href={mailHref} className="hover:text-white transition-colors">
                    {companyEmail}
                  </a>
                </p>
              )}
              {companyAddress && <p>🏢 {companyAddress}</p>}
            </div>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-12 pt-8 flex flex-col items-center justify-center text-center">
          <p className="text-slate-400 text-sm">
            © {year} {companyName || "—"}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
