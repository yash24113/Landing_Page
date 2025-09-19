import Link from "next/link";

/* ---------------------------------------------
   ISR (90 days)
---------------------------------------------- */
export const revalidate = 60 * 60 * 24 * 90; // 90 days

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
   API URLs + headers (server)
---------------------------------------------- */
const RAW_BASE = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") ?? "";
const PRODUCT_URL = RAW_BASE ? `${RAW_BASE}/product` : "";
const SEO_URL = RAW_BASE ? `${RAW_BASE}/seo` : "";
const LOC_URL = RAW_BASE ? `${RAW_BASE}/locations` : "";
const OFFICEINFO_URL = RAW_BASE ? `${RAW_BASE}/officeinformation` : "";

const API_KEY = process.env.NEXT_PUBLIC_API_KEY ?? "";
const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? "";
const API_KEY_HEADER = process.env.NEXT_PUBLIC_API_KEY_HEADER ?? "x-api-key";
const ADMIN_EMAIL_HEADER = process.env.NEXT_PUBLIC_ADMIN_EMAIL_HEADER ?? "x-admin-email";

/* ---------------------------------------------
   Helpers
---------------------------------------------- */
const norm = (s: any) => String(s ?? "").trim().toLowerCase();
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
   Footer (server component with ISR)
---------------------------------------------- */
export default async function Footer() {
  const headers: Record<string, string> = {};
  if (API_KEY) headers[API_KEY_HEADER] = API_KEY;
  if (ADMIN_EMAIL) headers[ADMIN_EMAIL_HEADER] = ADMIN_EMAIL;

  let products: Product[] = [];
  let seos: Seo[] = [];
  let locations: LocationDoc[] = [];
  let officeInfo: OfficeInformation | null = null;

  try {
    const [seoRes, prodRes, locRes, officeRes] = await Promise.all([
      fetch(SEO_URL, { headers, next: { revalidate } }),
      fetch(PRODUCT_URL, { headers, next: { revalidate } }),
      fetch(LOC_URL, { headers, next: { revalidate } }),
      fetch(OFFICEINFO_URL, { headers, next: { revalidate } }),
    ]);

    if (seoRes.ok) {
      const seoJson = await seoRes.json();
      seos = Array.isArray(seoJson?.data) ? seoJson.data : [];
    }
    if (prodRes.ok) {
      const prodJson = await prodRes.json();
      products = Array.isArray(prodJson?.data) ? prodJson.data : [];
    }
    if (locRes.ok) {
      const locJson = await locRes.json();
      const rawLocs = (locJson?.data?.locations ?? locJson?.data ?? locJson?.locations) ?? [];
      locations = Array.isArray(rawLocs) ? rawLocs : [];
    }
    if (officeRes.ok) {
      const officeJson = await officeRes.json();
      officeInfo = pickOfficeInfo(officeJson);
    }
  } catch (err) {
    console.error("Footer fetch error:", err);
  }

  // location-aware filtering
  const targetLocIds = new Set<string>();
  for (const l of locations) {
    if (norm(l?.name) === DEFAULT_LOCATION_SLUG || norm(l?.slug) === DEFAULT_LOCATION_SLUG) {
      if (l._id) targetLocIds.add(l._id);
    }
  }
  const targetLocCode = DEFAULT_LOCATION_SLUG;

  const targetLocationProductIds = new Set<string>();
  for (const s of seos) {
    if (isSeoForLocation(s, targetLocIds, targetLocCode)) {
      const pid = extractId(s.product);
      if (pid) targetLocationProductIds.add(pid);
    }
  }

  const productSlugById = new Map<string, string>();
  for (const s of seos) {
    const pid = extractId(s.product);
    const sl = s.slug?.trim();
    if (pid && sl && isSeoForLocation(s, targetLocIds, targetLocCode)) productSlugById.set(pid, sl);
  }
  for (const s of seos) {
    const pid = extractId(s.product);
    const sl = s.slug?.trim();
    if (pid && sl && !productSlugById.has(pid)) productSlugById.set(pid, sl);
  }

  const footerProducts = products
    .filter((p) => targetLocationProductIds.has(p._id.trim()))
    .map((p) => {
      const seoSlug = productSlugById.get(p._id);
      const finalSlug = (seoSlug || p.slug || "").trim();
      return { id: p._id, name: p.name, slug: finalSlug || undefined };
    })
    .slice(0, 6);

  /* ---------------------------------------------
     Company details
  ---------------------------------------------- */
  const companyName = officeInfo?.companyName?.trim() ?? "";
  const companyEmail = officeInfo?.companyEmail?.trim() ?? "";
  const primaryPhone =
    officeInfo?.companyPhone1?.trim() ||
    officeInfo?.whatsappNumber?.trim() ||
    officeInfo?.companyPhone2?.trim() ||
    "";
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
            <h3 className="text-2xl font-bold">{companyName || "—"}</h3>
            <p className="text-slate-300 leading-relaxed">
              Leading B2B fabric supplier connecting global manufacturers with premium textiles worldwide.
            </p>
          </div>

          {/* Products (location-aware) */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Products</h4>
            {footerProducts.length === 0 ? (
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

          {/* Contact */}
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
