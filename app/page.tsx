// app/page.tsx
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { WhatsAppButton } from "@/components/whatsapp-button";
import { Chatbot } from "@/components/chatbot";
import { FAQ } from "@/components/faq";
import { ContactForm } from "@/components/contact-form";
import JsonLdInjector from "@/components/json-ld-injector";

/* -------------------------------------------------
   Config
-------------------------------------------------- */
const DEFAULT_LOCATION_SLUG = "ahmedabad";

/* -------------------------------------------------
   API URLs
-------------------------------------------------- */
const RAW_BASE = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") ?? "";
const SEO_URL = RAW_BASE ? `${RAW_BASE}/seo` : "http://localhost:7000/landing/seo";
const PRODUCT_URL = RAW_BASE ? `${RAW_BASE}/product` : "http://localhost:7000/landing/product";
const LOC_URL = RAW_BASE ? `${RAW_BASE}/locations` : "http://localhost:7000/landing/locations";

/** Contact endpoint */
const CONTACT_URL =
  process.env.NEXT_PUBLIC_CONTACT_URL ??
  (RAW_BASE ? `${RAW_BASE}/contacts` : "http://localhost:7000/landing/contacts");

/* -------------------------------------------------
   AUTH HEADERS
-------------------------------------------------- */
const API_KEY = process.env.NEXT_PUBLIC_API_KEY ?? "";
const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? "";
const API_KEY_HEADER = process.env.NEXT_PUBLIC_API_KEY_HEADER ?? "x-api-key-yash";
const ADMIN_EMAIL_HEADER = process.env.NEXT_PUBLIC_ADMIN_EMAIL_HEADER ?? "x-admin-email";

const authHeaders: Record<string, string> = {};
if (API_KEY) authHeaders[API_KEY_HEADER] = API_KEY;
if (ADMIN_EMAIL) authHeaders[ADMIN_EMAIL_HEADER] = ADMIN_EMAIL;

/* -------------------------------------------------
   Helpers
-------------------------------------------------- */
const toId = (v: any) =>
  typeof v === "string" ? v.trim() : v?._id ? String(v._id).trim() : "";

const norm = (s: any) => String(s ?? "").trim().toLowerCase();

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, { cache: "no-store", headers: authHeaders });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

function pickImage(...candidates: Array<string | undefined | null>): string {
  for (const c of candidates) {
    const s = (c ?? "").toString().trim();
    if (!s) continue;
    if (s.startsWith("/") || s.startsWith("http://") || s.startsWith("https://")) {
      return s;
    }
  }
  return "/placeholder.svg?height=800&width=1200";
}

function pickImageNotEq(notEq: string, ...candidates: Array<string | undefined | null>): string {
  for (const c of candidates) {
    const s = (c ?? "").toString().trim();
    if (!s) continue;
    if ((s.startsWith("/") || s.startsWith("http://") || s.startsWith("https://")) && s !== notEq) {
      return s;
    }
  }
  return "/placeholder.svg?height=500&width=600";
}

/** Is this SEO row for the desired location? (by id OR locationCode === slug) */
function isSeoForLocation(seoRow: any, locIds: Set<string>, locSlug: string) {
  const locId = toId(seoRow?.location);
  const locCode = norm(seoRow?.locationCode);
  return (locId && locIds.has(locId)) || locCode === norm(locSlug);
}

// Include only DB fields, but omit values that Next.js rejects
const ALLOWED_OG_TYPES = new Set([
  "website",
  "article",
  "book",
  "profile",
  "music.song",
  "music.album",
  "music.playlist",
  "music.radio_station",
  "video.movie",
  "video.episode",
  "video.tv_show",
  "video.other",
]);
function ogTypeIfAllowed(v?: string) {
  const s = String(v ?? "").trim().toLowerCase();
  return (ALLOWED_OG_TYPES.has(s as any) ? (s as any) : undefined) as any;
}
const ALLOWED_TWITTER_CARDS = new Set(["summary", "summary_large_image", "player", "app"]);
function twitterCardIfAllowed(v?: string) {
  const s = String(v ?? "").trim().toLowerCase();
  return (ALLOWED_TWITTER_CARDS.has(s as any) ? (s as any) : undefined) as any;
}

/* -------------------------------------------------
   Meta helpers (mirror of slug/page.tsx)
-------------------------------------------------- */
function buildOtherMeta(seo: any) {
  const other: Record<string, string> = {};
  const set = (name: string, value: any) => {
    const v = value === undefined || value === null ? undefined : String(value);
    if (v !== undefined && v !== "") other[name] = v;
  };

  set("charset", seo.charset);
  set("viewport", seo.viewport);
  set("x-ua-compatible", seo.xUaCompatible);
  set("content-language", seo.contentLanguage);
  set("canonical", seo.canonical_url);
  set("keywords", seo.keywords);
  set("robots", seo.robots);

  set("seo:product", typeof seo.product === "string" ? seo.product : seo?.product?._id);
  set("seo:location", typeof seo.location === "string" ? seo.location : seo?.location?._id);
  set("seo:locationCode", seo.locationCode);
  set("seo:productIdentifier", seo.productIdentifier);
  set("seo:sku", seo.sku);
  set("seo:slug", seo.slug);
  set("seo:excerpt", seo.excerpt);
  set("seo:productdescription", seo.productdescription);
  set("seo:description_html", seo.description_html);
  set("seo:popularproduct", seo.popularproduct);
  set("seo:topratedproduct", seo.topratedproduct);
  set("seo:landingPageProduct", seo.landingPageProduct);
  set("seo:shopyProduct", seo.shopyProduct);
  set("seo:rating_value", seo.rating_value);
  set("seo:rating_count", seo.rating_count);
  set("seo:salesPrice", seo.salesPrice);
  set("seo:purchasePrice", seo.purchasePrice);

  set("google-site-verification", seo.googleSiteVerification);
  set("msvalidate.01", seo.msValidate);

  set("theme-color", seo.themeColor);
  set("apple-mobile-web-app-capable", seo.mobileWebAppCapable);
  set("apple-mobile-web-app-status-bar-style", seo.appleStatusBarStyle);
  set("format-detection", seo.formatDetection);

  set("og:url", seo.ogUrl);
  set("og:image", seo.ogImage);
  set("og:site_name", seo.ogSiteName);
  set("og:locale", seo.ogLocale);
  set("og:title", seo.ogTitle);
  set("og:description", seo.ogDescription);
  set("og:type (raw)", seo.ogType);

  set("og:video", seo.ogVideoUrl);
  set("og:video:secure_url", seo.ogVideoSecureUrl);
  set("og:video:type", seo.ogVideoType);
  if (typeof seo.ogVideoWidth !== "undefined") set("og:video:width", seo.ogVideoWidth);
  if (typeof seo.ogVideoHeight !== "undefined") set("og:video:height", seo.ogVideoHeight);

  set("twitter:card", seo.twitterCard);
  set("twitter:site", seo.twitterSite);
  set("twitter:title", seo.twitterTitle);
  set("twitter:description", seo.twitterDescription);
  set("twitter:image", seo.twitterImage);
  set("twitter:player", seo.twitterPlayer);
  if (typeof seo.twitterPlayerWidth !== "undefined") set("twitter:player:width", seo.twitterPlayerWidth);
  if (typeof seo.twitterPlayerHeight !== "undefined") set("twitter:player:height", seo.twitterPlayerHeight);

  set("hreflang", seo.hreflang);
  set("x-default", seo.x_default);
  set("author_name", seo.author_name);

  return other;
}

function parseJsonLd(input?: string) {
  if (!input || typeof input !== "string") return null;
  try {
    const j = JSON.parse(input);
    return j && typeof j === "object" ? j : null;
  } catch {
    return null;
  }
}

/* -------------------------------------------------
   Metadata (Ahmedabad-aware)
-------------------------------------------------- */
export async function generateMetadata(): Promise<Metadata> {
  const seoJson = await fetchJson<any>(SEO_URL);
  const locJson = await fetchJson<any>(LOC_URL);

  const seos: any[] = Array.isArray(seoJson?.data) ? seoJson.data : [];
  const rawLocs = (locJson?.data?.locations ?? locJson?.data ?? locJson?.locations) ?? [];
  const locs: any[] = Array.isArray(rawLocs) ? rawLocs : [];

  const targetLocIds = new Set<string>(
    locs
      .filter((l) => norm(l?.name) === DEFAULT_LOCATION_SLUG || norm(l?.slug) === DEFAULT_LOCATION_SLUG)
      .map((l) => String(l?._id ?? "").trim())
      .filter(Boolean),
  );

  const seoData =
    seos.find((s) => isSeoForLocation(s, targetLocIds, DEFAULT_LOCATION_SLUG)) || null;

  if (!seoData) return {};

  const ogImages = seoData.ogImage ? [{ url: seoData.ogImage }] : undefined;
  const twitterImages = seoData.twitterImage ? [{ url: seoData.twitterImage }] : undefined;

  const openGraph: any = {};
  if (seoData.ogTitle) openGraph.title = seoData.ogTitle;
  if (seoData.ogDescription) openGraph.description = seoData.ogDescription;
  if (seoData.ogSiteName) openGraph.siteName = seoData.ogSiteName;
  if (seoData.ogLocale) openGraph.locale = seoData.ogLocale;
  const ogType = ogTypeIfAllowed(seoData.ogType);
  if (ogType) openGraph.type = ogType;
  if (seoData.ogUrl) openGraph.url = seoData.ogUrl;
  if (ogImages) openGraph.images = ogImages;

  const twitter: any = {};
  const twCard = twitterCardIfAllowed(seoData.twitterCard);
  if (twCard) twitter.card = twCard;
  if (seoData.twitterTitle) twitter.title = seoData.twitterTitle;
  if (seoData.twitterDescription) twitter.description = seoData.twitterDescription;
  if (seoData.twitterSite) twitter.site = seoData.twitterSite;
  if (twitterImages) twitter.images = twitterImages;

  return {
    title: seoData.title,
    description: seoData.description,
    keywords: seoData.keywords,
    metadataBase: seoData.canonical_url ? new URL(seoData.canonical_url) : undefined,
    applicationName: seoData.ogSiteName,
    authors: seoData.author_name ? [{ name: seoData.author_name }] : undefined,
    creator: seoData.author_name,
    publisher: seoData.ogSiteName,
    openGraph: Object.keys(openGraph).length ? (openGraph as any) : undefined,
    twitter: Object.keys(twitter).length ? (twitter as any) : undefined,
    alternates: seoData.canonical_url ? { canonical: seoData.canonical_url } : undefined,
    robots: seoData.robots ? { index: true, follow: true } : undefined,
    viewport: seoData.viewport ? (seoData.viewport as any) : undefined,
    formatDetection: seoData.formatDetection ? ({ telephone: seoData.formatDetection !== "telephone=no" } as any) : undefined,
    verification:
      seoData.googleSiteVerification || seoData.msValidate
        ? { google: seoData.googleSiteVerification, other: seoData.msValidate ? { "msvalidate.01": seoData.msValidate } : undefined }
        : undefined,
    themeColor: seoData.themeColor,
    appleWebApp: seoData.mobileWebAppCapable
      ? ({ capable: seoData.mobileWebAppCapable === "yes", statusBarStyle: seoData.appleStatusBarStyle as any } as any)
      : undefined,
    other: buildOtherMeta(seoData),
  };
}

/* -------------------------------------------------
   Page
-------------------------------------------------- */
export default async function Page() {
  const [seoJson, prodJson, locJson] = await Promise.all([
    fetchJson<any>(SEO_URL),
    fetchJson<any>(PRODUCT_URL),
    fetchJson<any>(LOC_URL),
  ]);

  const seos: any[] = Array.isArray(seoJson?.data) ? seoJson.data : [];
  const products: any[] = Array.isArray(prodJson?.data) ? prodJson.data : [];

  // robust locations extraction
  const rawLocs = (locJson?.data?.locations ?? locJson?.data ?? locJson?.locations) ?? [];
  const locs: any[] = Array.isArray(rawLocs) ? rawLocs : [];

  // Collect target location ids (note: you have TWO "ahmedabad" ids; both are included)
  const targetLocIds = new Set<string>(
    locs
      .filter((l) => norm(l?.name) === DEFAULT_LOCATION_SLUG || norm(l?.slug) === DEFAULT_LOCATION_SLUG)
      .map((l) => String(l?._id ?? "").trim())
      .filter(Boolean),
  );

  // All SEO rows for this location
  const locSeoRows = seos.filter((s) => isSeoForLocation(s, targetLocIds, DEFAULT_LOCATION_SLUG));

  // Build quick lookups for products
  const productById = new Map<string, any>();
  const productBySlug = new Map<string, any>();

  for (const p of products) {
    const pid = String(p?._id ?? "").trim();
    if (pid) productById.set(pid, p);
    const pslug = String(p?.slug ?? "").trim().toLowerCase();
    if (pslug) productBySlug.set(pslug, p);
  }

  // Join SEO↔Product by productId (preferred) OR slug (fallback)
  const ahmedabadProducts: any[] = [];
  const seen = new Set<string>(); // avoid duplicates by product _id

  for (const s of locSeoRows) {
    const pid = toId(s?.product);
    const sSlug = norm(s?.slug);

    let p: any | undefined = undefined;

    if (pid && productById.has(pid)) {
      p = productById.get(pid);
    } else if (sSlug && productBySlug.has(sSlug)) {
      p = productBySlug.get(sSlug);
    }

    if (p) {
      const key = String(p._id);
      if (!seen.has(key)) {
        seen.add(key);
        ahmedabadProducts.push(p);
      }
    }
  }

  // Build a slug map preferring location rows (so links go to location-specific slug)
  const slugByProduct = new Map<string, string>();
  for (const s of seos) {
    const pid = toId(s.product);
    const sSlug = String(s?.slug ?? "").trim();
    if (!pid || !sSlug) continue;
    if (isSeoForLocation(s, targetLocIds, DEFAULT_LOCATION_SLUG)) {
      slugByProduct.set(pid, sSlug);
    } else if (!slugByProduct.has(pid)) {
      slugByProduct.set(pid, sSlug);
    }
  }

  // Hero selection
  const firstCard = ahmedabadProducts[0] || products[0] || null;

  // Prefer SEO row for this location for the hero card
  const firstCardSeo =
    seos.find(
      (s) =>
        isSeoForLocation(s, targetLocIds, DEFAULT_LOCATION_SLUG) &&
        (toId(s.product) === (firstCard?._id ?? "") || norm(s.slug) === norm(firstCard?.slug)),
    ) ||
    seos.find(
      (s) => toId(s.product) === (firstCard?._id ?? "") || norm(s.slug) === norm(firstCard?.slug),
    ) ||
    null;

  // Dynamic SEO fields for hero/overview
  const titleFromSeo = String(firstCardSeo?.productlocationtitle ?? "").trim();
  const taglineFromSeo = String(firstCardSeo?.productlocationtagline ?? "").trim();
  const desc1FromSeo = String(firstCardSeo?.productlocationdescription1 ?? "").trim();
  const desc2FromSeo = String(firstCardSeo?.productlocationdescription2 ?? "").trim();

  // Images
  const heroImage = pickImage(firstCard?.img, firstCard?.image1, firstCard?.image2);
  const heroName = (firstCard?.name || "Fabrics").toString();
  const heroAlt = heroName;
  const overviewImage = pickImageNotEq(heroImage, firstCard?.image2, firstCard?.image1, firstCard?.img);
  const overviewAlt = firstCard?.name ? `${firstCard.name} — secondary view` : "";

  // alias for ContactForm to avoid TSX parse errors
  const AnyContactForm = ContactForm as any;

  return (
    <main className="min-h-screen bg-white">
      {/* Structured data (only API-provided) */}
      <JsonLdInjector
        videoLd={parseJsonLd(seos[0]?.VideoJsonLd)}
        logoLd={parseJsonLd(seos[0]?.LogoJsonLd)}
        breadcrumbLd={parseJsonLd(seos[0]?.BreadcrumbJsonLd)}
        localBusinessLd={(() => {
          const s = seos[0] || null;
          if (!s) return undefined;
          // Try raw JSON first; if missing/minimal, synthesize only from DB values
          const raw = parseJsonLd(s?.LocalBusinessJsonLd);
          if (raw && typeof raw === "object" && Object.keys(raw).length > 1) return raw;
          const addr: any = {};
          const nonEmpty = (v: any) => (typeof v === "string" && v.trim().length ? v.trim() : undefined);
          if (nonEmpty(s?.LocalBusinessJsonLdaddressstreetAddress)) addr.streetAddress = nonEmpty(s?.LocalBusinessJsonLdaddressstreetAddress);
          if (nonEmpty(s?.LocalBusinessJsonLdaddressaddressLocality)) addr.addressLocality = nonEmpty(s?.LocalBusinessJsonLdaddressaddressLocality);
          if (nonEmpty(s?.LocalBusinessJsonLdaddressaddressRegion)) addr.addressRegion = nonEmpty(s?.LocalBusinessJsonLdaddressaddressRegion);
          if (nonEmpty(s?.LocalBusinessJsonLdaddresspostalCode)) addr.postalCode = nonEmpty(s?.LocalBusinessJsonLdaddresspostalCode);
          if (nonEmpty(s?.LocalBusinessJsonLdaddressaddressCountry)) addr.addressCountry = nonEmpty(s?.LocalBusinessJsonLdaddressaddressCountry);
          const geo: any = {};
          if (nonEmpty(s?.LocalBusinessJsonLdgeolatitude)) geo.latitude = Number(s?.LocalBusinessJsonLdgeolatitude);
          if (nonEmpty(s?.LocalBusinessJsonLdgeolongitude)) geo.longitude = Number(s?.LocalBusinessJsonLdgeolongitude);
          const hasAddr = Object.keys(addr).length > 0;
          const hasGeo = Object.keys(geo).length > 0;
          const name = nonEmpty(s?.LocalBusinessJsonLdname);
          const telephone = nonEmpty(s?.LocalBusinessJsonLdtelephone);
          const url = nonEmpty(s?.canonical_url);
          if (!name && !telephone && !hasAddr && !hasGeo && !url) return undefined;
          const out: any = { "@context": "https://schema.org", "@type": nonEmpty(s?.LocalBusinessJsonLdtype) || "LocalBusiness" };
          if (name) out.name = name;
          if (url) out.url = url;
          if (telephone) out.telephone = telephone;
          if (nonEmpty(s?.description)) out.description = nonEmpty(s?.description);
          if (nonEmpty(s?.LocalBusinessJsonLdareaserved)) out.areaServed = nonEmpty(s?.LocalBusinessJsonLdareaserved);
          if (hasAddr) out.address = { "@type": nonEmpty(s?.LocalBusinessJsonLdaddresstype) || "PostalAddress", ...addr };
          if (hasGeo) out.geo = { "@type": nonEmpty(s?.LocalBusinessJsonLdgeotype) || "GeoCoordinates", ...geo };
          return out;
        })()}
      />
      {/* HERO */}
      <section className="hero relative bg-white text-slate-900 overflow-hidden pt-4 pb-8 sm:pt-8">
        <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:grid lg:grid-cols-2 gap-8 items-center">
            {/* Left */}
            <div className="space-y-8 w-full mt-6 lg:mt-0">
              <h1 className="text-3xl sm:text-4xl lg:text-6xl font-bold leading-tight">
                {titleFromSeo ? (
                  titleFromSeo
                ) : (
                  <>
                    Premium{" "}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-emerald-700">
                      {heroName}
                    </span>{" "}
                    for Global Manufacturers
                  </>
                )}
              </h1>

              <p className="text-base sm:text-xl text-slate-700 max-w-2xl">
                {taglineFromSeo ||
                  "Connect with leading fabric suppliers worldwide. Quality textiles, competitive pricing, and reliable supply chains."}
              </p>

              {firstCardSeo && (
                <div className="bg-slate-100 rounded-lg p-4 grid grid-cols-2 gap-4 text-sm">
                  {typeof firstCardSeo.sku !== "undefined" && (
                    <div>
                      <span className="text-slate-700">SKU:</span>
                      <span className="ml-2 text-slate-900">{firstCardSeo.sku}</span>
                    </div>
                  )}
                  {typeof firstCardSeo.salesPrice !== "undefined" && (
                    <div>
                      <span className="text-slate-700">Price:</span>
                      <span className="ml-2 text-slate-900">{firstCardSeo.salesPrice}</span>
                    </div>
                  )}
                  {typeof firstCardSeo.rating_value !== "undefined" && (
                    <div>
                      <span className="text-slate-700">Rating:</span>
                      <span className="ml-2 text-slate-900">{firstCardSeo.rating_value}/5</span>
                    </div>
                  )}
                  {typeof firstCardSeo.rating_count !== "undefined" && (
                    <div>
                      <span className="text-slate-700">Reviews:</span>
                      <span className="ml-2 text-slate-900">{firstCardSeo.rating_count}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-4">
                <a href="#contact" className="px-8 py-4 btn-primary">
                  Get Quote Now
                </a>
                <a href="tel:+1234567890" className="px-8 py-4 btn-secondary">
                  📞 Call Now
                </a>
                <a
                  href="https://n8n.egport.com/webhook/a59f3482-d830-4d83-ae0e-3e5a955350a9"
                  className="px-6 py-3 border-2 border-emerald-600 text-emerald-700 hover:bg-emerald-700 hover:text-white rounded-lg font-semibold transition-all duration-200"
                >
                  📋 Free Catalog
                </a>
              </div>

              <div className="flex flex-wrap gap-4 text-sm text-slate-700 mt-2">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full" />
                  <span>ISO Certified</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full" />
                  <span>Global Shipping</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full" />
                  <span>24/7 Support</span>
                </div>
              </div>
            </div>

            {/* Right (Image) */}
            <div className="relative flex items-center justify-center w-full min-h-[220px] sm:min-h-[320px] lg:min-h-[400px]">
              <div className="relative z-10 w-full h-56 sm:h-80 lg:h-[420px] rounded-2xl overflow-hidden shadow-lg">
                <Image
                  key={heroImage}
                  src={heroImage}
                  alt={heroAlt}
                  fill
                  priority
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 800px"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* COMPANY OVERVIEW (SEO text) */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-6">
              Leading B2B Fabric Supplier Worldwide
            </h2>
            <p className="text-slate-600 mb-8">
              ISO 9001 Certified • 500+ Global Partners • Ships to 50+ Countries
            </p>
            <div className="w-24 h-1 bg-gradient-to-r from-blue-600 to-emerald-600 mx-auto mb-8" />
          </div>

          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-6">
              <p className="text-lg text-slate-700 leading-relaxed">
                {desc1FromSeo ||
                  "As a premier B2B fabric supplier, we specialize in providing high-quality textiles to global garment manufacturers, clothing retailers, and fabric trading companies. Our extensive network spans across major textile hubs worldwide, ensuring consistent supply chains and competitive pricing for bulk fabric orders."}
              </p>

              <p className="text-lg text-slate-700 leading-relaxed">
                {desc2FromSeo ||
                  "Our commitment to excellence extends beyond product quality to encompass reliable logistics, flexible payment terms, and comprehensive customer support. Whether you’re sourcing fabrics for fast fashion, luxury apparel, or industrial textiles, our team delivers customized solutions."}
              </p>

              <div className="grid sm:grid-cols-2 gap-6 mt-8">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                  <div className="text-3xl font-bold mb-2">500+</div>
                  <div className="text-slate-600">Global Partners</div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                  <div className="text-3xl font-bold mb-2">50+</div>
                  <div className="text-slate-600">Countries Served</div>
                </div>
              </div>
            </div>

            <div className="relative">
              <Image
                key={overviewImage}
                src={overviewImage}
                alt={overviewAlt}
                width={600}
                height={500}
                loading="lazy"
                className="rounded-2xl shadow-lg object-cover w-full h-auto"
                sizes="(max-width: 1024px) 100vw, 600px"
              />
            </div>
          </div>
        </div>
      </section>

      {/* PRODUCTS — ALL Ahmedabad */}
      <section id="products" className="py-20 bg-white" aria-labelledby="product-categories">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 id="product-categories" className="text-3xl sm:text-4xl font-bold text-slate-900 mb-6">
              Explore Our Fabric Catalog
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              {taglineFromSeo || "Comprehensive range of premium fabrics for every manufacturing need"}
            </p>
          </div>

          {ahmedabadProducts.length === 0 ? (
            <div className="text-center text-slate-600">
              No products for the selected location.
            </div>
          ) : (
            <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
              {ahmedabadProducts.map((p) => {
                const img =
                  (p.img ?? p.image1 ?? p.image2 ?? "/placeholder.svg?height=300&width=400").toString();
                const pid = String(p?._id ?? "").trim();
                // Prefer a location-specific slug if we have it
                const seoSlug = slugByProduct.get(pid) || p?.slug;
                const href = seoSlug ? `/${seoSlug}` : "#";

                const Card = (
                  <div className="relative overflow-hidden rounded-2xl shadow-lg border border-slate-100 hover:border-blue-200 transition">
                    <div className="relative w-full h-48">
                      <Image
                        src={img}
                        alt={`${p.name} - ${p.productdescription ?? ""}`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                      />
                    </div>
                    <div className="p-6">
                      <h3 className="text-xl font-bold text-slate-900 mb-3">{p.name}</h3>
                      <p className="text-slate-600 line-clamp-3">{p.productdescription || "—"}</p>
                    </div>
                  </div>
                );

                return (
                  <article key={pid}>
                    {href === "#" ? (
                      <div className="opacity-100">{Card}</div>
                    ) : (
                      <Link className="block group hover:opacity-95" href={href}>
                        {Card}
                      </Link>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* FAQ */}
      <FAQ />

      {/* CONTACT */}
      <section id="contact" className="py-20 bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6 text-center">
            Get Your Custom Quote Today
          </h2>
          <div className="grid lg:grid-cols-2 gap-16">
            <AnyContactForm
              submitAction={submitContact}
              saveDraftAction={saveContactDraft}
              submitUrl={undefined}
              submitHeaders={undefined}
            />
            <div className="space-y-6 text-white">
              <div>📞 +91 9925155141</div>
              <div>✉️ rajesh.goyal@amritafashions.com</div>
              <div>🏢 Ahmedabad, Gujarat-380015</div>
              <div>🕘 Mon–Sat: 9:30 AM – 7:00 PM IST</div>
            </div>
          </div>
        </div>
      </section>

      {/* Floating actions */}
      <WhatsAppButton />
      <Chatbot />
    </main>
  );
}

// Alias to render ContactForm without invalid JSX like <(ContactForm as any) />
const AnyContactForm = ContactForm as any;

/* -------------------------------------------------
   Server actions (unchanged)
-------------------------------------------------- */
export async function saveContactDraft(fd: FormData) {
  "use server";
  const draftId = (fd.get("draftId") ?? "").toString().trim();

  const body: any = {
    companyName: (fd.get("companyName") ?? "").toString(),
    contactPerson: (fd.get("contactPerson") ?? "").toString(),
    email: (fd.get("email") ?? "").toString(),
    phoneNumber: (fd.get("phoneNumber") ?? "").toString(),
    businessType: (fd.get("businessType") ?? "").toString(),
    annualFabricVolume: (fd.get("annualFabricVolume") ?? "").toString(),
    primaryMarkets: (fd.get("primaryMarkets") ?? "").toString(),
    specificationsRequirements: (fd.get("specificationsRequirements") ?? "").toString(),
    timeline: (fd.get("timeline") ?? "").toString(),
    additionalMessage: (fd.get("additionalMessage") ?? "").toString(),
    status: "draft",
    stepCompleted: Number(fd.get("stepCompleted") ?? 0) || 0,
  };

  const ftoi = fd.getAll("fabricTypesOfInterest").map((x) => x.toString().trim()).filter(Boolean);
  body.fabricTypesOfInterest = ftoi;

  try {
    if (!draftId) {
      const res = await fetch(CONTACT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify(body),
        cache: "no-store",
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        return { ok: false as const, message: json?.message || "Failed to create draft" };
      }
      return { ok: true as const, id: json?.data?._id, data: json?.data };
    } else {
      const res = await fetch(`${CONTACT_URL}/${draftId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify(body),
        cache: "no-store",
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        return { ok: false as const, message: json?.message || "Failed to update draft" };
      }
      return { ok: true as const, id: draftId, data: json?.data };
    }
  } catch (e: any) {
    return { ok: false as const, message: e?.message || "Draft save error" };
  }
}

export async function submitContact(formData: FormData) {
  "use server";
  const draftId = (formData.get("draftId") ?? "").toString().trim();

  const payload: any = {
    companyName: (formData.get("companyName") ?? "").toString().trim(),
    contactPerson: (formData.get("contactPerson") ?? "").toString().trim(),
    email: (formData.get("email") ?? "").toString().trim(),
    phoneNumber: (formData.get("phoneNumber") ?? "").toString().trim(),
    businessType: (formData.get("businessType") ?? "").toString().trim(),
    annualFabricVolume: (formData.get("annualFabricVolume") ?? "").toString().trim(),
    primaryMarkets: (formData.get("primaryMarkets") ?? "").toString().trim(),
    specificationsRequirements: (formData.get("specificationsRequirements") ?? "").toString().trim(),
    timeline: (formData.get("timeline") ?? "").toString().trim(),
    additionalMessage: (formData.get("additionalMessage") ?? "").toString().trim(),
    status: "submitted",
    stepCompleted: 3,
  };

  const ftoi = formData.getAll("fabricTypesOfInterest").map((v) => v.toString().trim()).filter(Boolean);
  payload.fabricTypesOfInterest = ftoi;

  try {
    const res = await fetch(draftId ? `${CONTACT_URL}/${draftId}` : CONTACT_URL, {
      method: draftId ? "PUT" : "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders,
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return {
        ok: false as const,
        status: res.status,
        message: err?.message || "Failed to create contact",
        error: err?.error,
      };
    }

    const json = await res.json().catch(() => ({}));
    return {
      ok: true as const,
      status: 201,
      message: json?.message || "Contact created successfully",
      data: json?.data ?? null,
    };
  } catch (e: any) {
    return {
      ok: false as const,
      status: 500,
      message: "Network/Server error while creating contact",
      error: e?.message,
    };
  }
}
