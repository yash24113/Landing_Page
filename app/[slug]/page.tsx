// app/[slug]/page.tsx
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { WhatsAppButton } from "@/components/whatsapp-button";
import { Chatbot } from "@/components/chatbot";
import { FAQ } from "@/components/faq";
import { ContactForm } from "@/components/contact-form";
import { fetchSeoData } from "@/lib/seo";
import JsonLdInjector from "@/components/json-ld-injector";

/* -------------------------------------------------
   API + Auth used for related-products logic
-------------------------------------------------- */
const RAW_BASE = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") ?? "";
const SEO_LIST_URL = RAW_BASE ? `${RAW_BASE}/seo` : "http://localhost:7000/landing/seo";
const PRODUCT_URL  = RAW_BASE ? `${RAW_BASE}/product` : "http://localhost:7000/landing/product";

const API_KEY = process.env.NEXT_PUBLIC_API_KEY ?? "";
const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? "";
const API_KEY_HEADER = process.env.NEXT_PUBLIC_API_KEY_HEADER ?? "x-api-key-yash";
const ADMIN_EMAIL_HEADER = process.env.NEXT_PUBLIC_ADMIN_EMAIL_HEADER ?? "x-admin-email";

const authHeaders: Record<string, string> = {};
if (API_KEY) authHeaders[API_KEY_HEADER] = API_KEY;
if (ADMIN_EMAIL) authHeaders[ADMIN_EMAIL_HEADER] = ADMIN_EMAIL;

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, { cache: "no-store", headers: authHeaders });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

const norm = (s: any) => String(s ?? "").trim().toLowerCase();
const toId = (v: any) =>
  typeof v === "string" ? v.trim() : v?._id ? String(v._id).trim() : "";

/* -------------------------------------------------
   Next.js dynamic flags
-------------------------------------------------- */
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

// In Next.js 15 some dynamic contexts provide `params` as a Promise
type Props = { params: Promise<{ slug: string }> | { slug: string } };

/* -------------------------------------------------
   Types
-------------------------------------------------- */
interface SeoDocFull {
  _id?: string;
  product?: string | { _id?: string };
  purchasePrice?: number;
  salesPrice?: number;
  location?: string | { _id?: string };
  locationCode?: string;
  productIdentifier?: string;
  sku?: string;
  productdescription?: string;
  popularproduct?: boolean;
  topratedproduct?: boolean;
  landingPageProduct?: boolean;
  shopyProduct?: boolean;
  slug?: string;
  canonical_url?: string;
  ogUrl?: string;
  excerpt?: string;
  description_html?: string;
  rating_value?: number;
  rating_count?: number;
  charset?: string;
  xUaCompatible?: string;
  viewport?: string;
  title?: string;
  description?: string;

  // explicit
  hreflang?: string;
  x_default?: string;
  author_name?: string;

  productlocationtitle?: string;
  productlocationtagline?: string;
  productlocationdescription1?: string;
  productlocationdescription2?: string;

  keywords?: string;
  robots?: string;
  contentLanguage?: string;
  googleSiteVerification?: string;
  msValidate?: string;
  themeColor?: string;
  mobileWebAppCapable?: string;
  appleStatusBarStyle?: string;
  formatDetection?: string;

  ogLocale?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogType?: string;
  ogSiteName?: string;

  ogImage?: string;
  ogVideoUrl?: string;
  ogVideoSecureUrl?: string;
  ogVideoType?: string;
  ogVideoWidth?: number;
  ogVideoHeight?: number;

  twitterCard?: string;
  twitterSite?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  twitterPlayer?: string;
  twitterPlayerWidth?: number;
  twitterPlayerHeight?: number;

  VideoJsonLd?: string;
  LogoJsonLd?: string;
  LogoJsonLdcontext?: string;
  LogoJsonLdtype?: string;
  logoJsonLdurl?: string;
  logoJsonLdwidth?: string;
  logoJsonLdheight?: string;

  BreadcrumbJsonLdcontext?: string;
  BreadcrumbJsonLdtype?: string;
  BreadcrumbJsonLdname?: string;
  BreadcrumbJsonLditemListElement?: string;

  LocalBusinessJsonLdcontext?: string;
  LocalBusinessJsonLdtype?: string;
  LocalBusinessJsonLdname?: string;
  LocalBusinessJsonLdurl?: string;
  LocalBusinessJsonLdtelephone?: string;
  LocalBusinessJsonLdaddressstreetAddress?: string;
  LocalBusinessJsonLdaddressaddressLocality?: string;
  LocalBusinessJsonLdaddressaddressRegion?: string;
  LocalBusinessJsonLdaddresspostalCode?: string;
  LocalBusinessJsonLdaddressaddressCountry?: string;
  LocalBusinessJsonLdgeoLatitude?: string;
  LocalBusinessJsonLdgeoLongitude?: string;
  LocalBusinessJsonLdopeningHoursSpecification?: string;
  LocalBusinessJsonLdareaserved?: string;
}

type ProductDoc = {
  _id: string;
  name?: string;
  slug?: string;
  img?: string;
  image1?: string;
  image2?: string;
  productdescription?: string;
};

/* -------------------------------------------------
   Basic helpers (no fallbacks for SEO)
-------------------------------------------------- */
const isAssetSlug = (slug?: string) => !!slug && slug.includes(".");
const nonEmpty = (s: any) => (typeof s === "string" && s.trim().length ? s.trim() : undefined);
const asString = (v: any) => (v === undefined || v === null ? undefined : String(v));
const asBoolString = (v: any) => (v === true ? "true" : v === false ? "false" : undefined);

// Allow-list validators (omit invalid values instead of falling back)
const ALLOWED_OG_TYPES = new Set([
  "website","article","book","profile",
  "music.song","music.album","music.playlist","music.radio_station",
  "video.movie","video.episode","video.tv_show","video.other",
]);
function ogTypeIfAllowed(v: unknown) {
  const t = String(v ?? "").toLowerCase().trim();
  return (ALLOWED_OG_TYPES.has(t) ? (t as any) : undefined) as any;
}
const ALLOWED_TWITTER_CARDS = new Set(["summary", "summary_large_image", "player", "app"]);
function twitterCardIfAllowed(v: unknown) {
  const t = String(v ?? "").toLowerCase().trim();
  return (ALLOWED_TWITTER_CARDS.has(t) ? (t as any) : undefined) as any;
}

function getLinkedProductId(prod: SeoDocFull["product"]): string {
  if (!prod) return "";
  if (typeof prod === "string") return prod.trim();
  if (typeof prod === "object" && (prod as any)._id) return String((prod as any)._id).trim();
  return "";
}

/* -------------------------------------------------
   Meta helpers
-------------------------------------------------- */
function buildOtherMeta(seo: SeoDocFull) {
  const other: Record<string, string> = {};
  const set = (name: string, value: any) => {
    const v = asString(value);
    if (v !== undefined && v !== "") other[name] = v;
  };

  // Core
  set("charset", seo.charset);
  set("viewport", seo.viewport);
  set("x-ua-compatible", seo.xUaCompatible);
  set("content-language", seo.contentLanguage);
  set("canonical", seo.canonical_url);
  set("keywords", seo.keywords);
  set("robots", seo.robots);

  // IDs & flags
  set("seo:product", typeof seo.product === "string" ? seo.product : (seo.product as any)?._id);
  set("seo:location", typeof seo.location === "string" ? seo.location : (seo.location as any)?._id);
  set("seo:locationCode", seo.locationCode);
  set("seo:productIdentifier", seo.productIdentifier);
  set("seo:sku", seo.sku);
  set("seo:slug", seo.slug);
  set("seo:excerpt", seo.excerpt);
  set("seo:productdescription", seo.productdescription);
  set("seo:description_html", seo.description_html);
  set("seo:popularproduct", asBoolString(seo.popularproduct));
  set("seo:topratedproduct", asBoolString(seo.topratedproduct));
  set("seo:landingPageProduct", asBoolString(seo.landingPageProduct));
  set("seo:shopyProduct", asBoolString(seo.shopyProduct));
  set("seo:rating_value", seo.rating_value);
  set("seo:rating_count", seo.rating_count);
  set("seo:salesPrice", seo.salesPrice);
  set("seo:purchasePrice", seo.purchasePrice);

  // Platform
  set("google-site-verification", seo.googleSiteVerification);
  set("msvalidate.01", seo.msValidate);

  // Device/PWA
  set("theme-color", seo.themeColor);
  set("apple-mobile-web-app-capable", seo.mobileWebAppCapable);
  set("apple-mobile-web-app-status-bar-style", seo.appleStatusBarStyle);
  set("format-detection", seo.formatDetection);

  // Open Graph (mirror)
  set("og:url", seo.ogUrl);
  set("og:image", seo.ogImage);
  set("og:site_name", seo.ogSiteName);
  set("og:locale", seo.ogLocale);
  set("og:title", seo.ogTitle);
  set("og:description", seo.ogDescription);
  set("og:type (raw)", seo.ogType);

  // OG Video
  set("og:video", seo.ogVideoUrl);
  set("og:video:secure_url", seo.ogVideoSecureUrl);
  set("og:video:type", seo.ogVideoType);
  if (typeof seo.ogVideoWidth !== "undefined") set("og:video:width", seo.ogVideoWidth);
  if (typeof seo.ogVideoHeight !== "undefined") set("og:video:height", seo.ogVideoHeight);

  // Twitter (mirror)
  set("twitter:card", seo.twitterCard);
  set("twitter:site", seo.twitterSite);
  set("twitter:title", seo.twitterTitle);
  set("twitter:description", seo.twitterDescription);
  set("twitter:image", seo.twitterImage);
  set("twitter:player", seo.twitterPlayer);
  if (typeof seo.twitterPlayerWidth !== "undefined") set("twitter:player:width", seo.twitterPlayerWidth);
  if (typeof seo.twitterPlayerHeight !== "undefined") set("twitter:player:height", seo.twitterPlayerHeight);

  // Hreflang helpers
  set("hreflang", seo.hreflang);
  set("x-default", seo.x_default);
  set("author_name", seo.author_name);

  return other;
}

/* ---------- JSON-LD helpers ---------- */
function parseJsonLd(input?: string) {
  if (!input || typeof input !== "string") return null;
  try { const j = JSON.parse(input); return j && typeof j === "object" ? j : null; } catch { return null; }
}
function buildLocalBusinessLdStrict(seo: SeoDocFull) {
  const name = nonEmpty(seo.LocalBusinessJsonLdname);
  const url = nonEmpty(seo.canonical_url);
  const telephone = nonEmpty(seo.LocalBusinessJsonLdtelephone);
  const address: any = {};
  if (nonEmpty(seo.LocalBusinessJsonLdaddressstreetAddress)) address.streetAddress = nonEmpty(seo.LocalBusinessJsonLdaddressstreetAddress);
  if (nonEmpty(seo.LocalBusinessJsonLdaddressaddressLocality)) address.addressLocality = nonEmpty(seo.LocalBusinessJsonLdaddressaddressLocality);
  if (nonEmpty(seo.LocalBusinessJsonLdaddressaddressRegion)) address.addressRegion = nonEmpty(seo.LocalBusinessJsonLdaddressaddressRegion);
  if (nonEmpty(seo.LocalBusinessJsonLdaddresspostalCode)) address.postalCode = nonEmpty(seo.LocalBusinessJsonLdaddresspostalCode);
  if (nonEmpty(seo.LocalBusinessJsonLdaddressaddressCountry)) address.addressCountry = nonEmpty(seo.LocalBusinessJsonLdaddressaddressCountry);
  const hasAddress = Object.keys(address).length > 0;
  const geo: any = {};
  if (nonEmpty(seo.LocalBusinessJsonLdgeoLatitude)) geo.latitude = Number(seo.LocalBusinessJsonLdgeoLatitude);
  if (nonEmpty(seo.LocalBusinessJsonLdgeoLongitude)) geo.longitude = Number(seo.LocalBusinessJsonLdgeoLongitude);
  const hasGeo = Object.keys(geo).length > 0;
  if (!name && !telephone && !hasAddress && !hasGeo && !url) return null;
  const ld: any = { "@context": "https://schema.org", "@type": nonEmpty(seo.LocalBusinessJsonLdtype) || "LocalBusiness" };
  if (name) ld.name = name;
  if (url) ld.url = url;
  if (telephone) ld.telephone = telephone;
  if (nonEmpty(seo.description)) ld.description = nonEmpty(seo.description);
  if (nonEmpty(seo.LocalBusinessJsonLdareaserved)) ld.areaServed = nonEmpty(seo.LocalBusinessJsonLdareaserved);
  if (hasAddress) ld.address = { "@type": "PostalAddress", ...address };
  if (hasGeo) ld.geo = { "@type": "GeoCoordinates", ...geo };
  return ld;
}
// Remove any builders with hard-coded defaults. Only parse JSON provided by API.

/* ---------- Metadata ---------- */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const seo = await fetchSeoData(slug);
  if (!seo) return {};
  const seoFull = seo as SeoDocFull;

  // Build Metadata strictly from DB fields (omit missing)
  const ogImages = seoFull.ogImage ? [{ url: seoFull.ogImage }] : undefined;
  const ogVideos = seoFull.ogVideoUrl
    ? [{ url: seoFull.ogVideoUrl, secureUrl: seoFull.ogVideoSecureUrl, type: seoFull.ogVideoType as any, width: seoFull.ogVideoWidth as any, height: seoFull.ogVideoHeight as any }]
    : undefined;
  const twitterImages = seoFull.twitterImage ? [{ url: seoFull.twitterImage }] : undefined;

  const openGraph: any = {};
  if (seoFull.ogUrl) openGraph.url = seoFull.ogUrl;
  if (seoFull.ogSiteName) openGraph.siteName = seoFull.ogSiteName;
  if (seoFull.ogLocale) openGraph.locale = seoFull.ogLocale;
  if (seoFull.ogTitle) openGraph.title = seoFull.ogTitle;
  if (seoFull.ogDescription) openGraph.description = seoFull.ogDescription;
  const ogType = ogTypeIfAllowed(seoFull.ogType);
  if (ogType) openGraph.type = ogType;
  if (ogImages) openGraph.images = ogImages;
  if (ogVideos) openGraph.videos = ogVideos;

  const twitter: any = {};
  const twCard = twitterCardIfAllowed(seoFull.twitterCard);
  if (twCard) twitter.card = twCard;
  if (seoFull.twitterSite) twitter.site = seoFull.twitterSite;
  if (seoFull.twitterTitle) twitter.title = seoFull.twitterTitle;
  if (seoFull.twitterDescription) twitter.description = seoFull.twitterDescription;
  if (twitterImages) twitter.images = twitterImages;

  return {
    title: seoFull.title,
    description: seoFull.description,
    keywords: seoFull.keywords ? seoFull.keywords.split(",").map((k) => k.trim()).filter(Boolean) : undefined,
    metadataBase: seoFull.canonical_url ? new URL(seoFull.canonical_url) : undefined,
    applicationName: seoFull.ogSiteName,
    authors: seoFull.author_name ? [{ name: seoFull.author_name }] : undefined,
    creator: seoFull.author_name,
    publisher: seoFull.ogSiteName,
    robots: seoFull.robots ? { index: true, follow: true } : undefined,
    // Only include viewport/formatDetection if explicitly provided
    viewport: seoFull.viewport ? (seoFull.viewport as any) : undefined,
    formatDetection: seoFull.formatDetection ? ({ telephone: seoFull.formatDetection !== "telephone=no" } as any) : undefined,
    verification:
      seoFull.googleSiteVerification || seoFull.msValidate
        ? { google: seoFull.googleSiteVerification, other: seoFull.msValidate ? { "msvalidate.01": seoFull.msValidate } : undefined }
        : undefined,
    themeColor: seoFull.themeColor,
    appleWebApp: seoFull.mobileWebAppCapable ? ({ capable: seoFull.mobileWebAppCapable === "yes", statusBarStyle: seoFull.appleStatusBarStyle as any } as any) : undefined,
    openGraph: Object.keys(openGraph).length ? (openGraph as any) : undefined,
    twitter: Object.keys(twitter).length ? (twitter as any) : undefined,
    alternates: seoFull.canonical_url ? { canonical: new URL(seoFull.canonical_url).toString() } : undefined,
    other: buildOtherMeta(seoFull),
  };
}

/* ---------- Page ---------- */
export default async function SlugPage({ params }: Props) {
  const resolved = "then" in (params as any) ? await (params as Promise<{ slug: string }>) : (params as { slug: string });
  const { slug } = resolved;
  if (isAssetSlug(slug)) return null;

  // Get current SEO doc and all products
  const [{ fetchProductData }] = await Promise.all([import("@/lib/seo")]);
  const [rawSeo, productsArr] = await Promise.all([fetchSeoData(slug), fetchProductData()]);
  if (!rawSeo) notFound();
  const seo = rawSeo as SeoDocFull;

  // --- Build RELATED (same location) ---
  const currentLocId = toId(seo.location);
  const currentLocCode = norm(seo.locationCode);

  const seoListJson = await fetchJson<any>(SEO_LIST_URL);
  const allSeos: SeoDocFull[] = Array.isArray(seoListJson?.data) ? seoListJson.data : [];

  const relatedProductIds = new Set<string>();
  const slugByProduct = new Map<string, string>(); // prefer location-specific slug
  for (const s of allSeos) {
    const locId = toId(s.location);
    const locCode = norm(s.locationCode);
    const pid = toId(s.product);
    const sSlug = String(s?.slug ?? "").trim();

    // strict same-location: prefer id match; use code only if an id missing on either side
    let sameLocation = false;
    if (currentLocId && locId) {
      sameLocation = currentLocId === locId;
    } else if (!currentLocId || !locId) {
      if (currentLocCode && locCode) sameLocation = currentLocCode === locCode;
    }

    if (pid && sameLocation) {
      relatedProductIds.add(pid);
      if (sSlug) slugByProduct.set(pid, sSlug);
    } else if (pid && sSlug && !slugByProduct.has(pid)) {
      slugByProduct.set(pid, sSlug);
    }
  }

  const allProducts: ProductDoc[] = Array.isArray(productsArr) ? (productsArr as ProductDoc[]) : [];
  const relatedProducts: ProductDoc[] = allProducts.filter((p) => relatedProductIds.has(String(p?._id)));

  // Current linked product (hero)
  const linkedProductId = getLinkedProductId(seo.product);

  // ✅ Do not repeat hero product inside related list/grid
  const relatedProductsClean = relatedProducts.filter((p) => String(p._id) !== linkedProductId);

  // Build footer links: name + href only, deduped, max 8
  const footerRelatedLinks = relatedProductsClean
    .map((p) => {
      const pid = String(p._id);
      const s = slugByProduct.get(pid) || p.slug;
      const name = p.name?.trim() || "Fabric";
      return s ? { name, href: `/${s}` } : null;
    })
    .filter(Boolean) as { name: string; href: string }[];

  // Linked product for hero images
  const matchingProduct: ProductDoc | null =
    allProducts.find((p) => p._id === linkedProductId) || null;

  // HERO / overview images
  let heroImage = "/placeholder.svg?height=600&width=800";
  let heroAlt = "Premium fabric warehouse with organized textile rolls";
  if (matchingProduct?.img) {
    heroImage = matchingProduct.img;
    heroAlt = matchingProduct.name || heroAlt;
  }
  const overviewImage =
    (matchingProduct?.image2 || matchingProduct?.image1 || matchingProduct?.img || "/placeholder.svg?height=500&width=600") as string;
  const overviewAlt = matchingProduct?.name ? `${matchingProduct.name} — secondary view` : "Modern textile manufacturing facility";

  // Dynamic copy
  const locationTitle = seo.productlocationtitle?.trim() || "";
  const locationTagline = seo.productlocationtagline?.trim() || "";
  const locationDesc1 = seo.productlocationdescription1?.trim() || "";
  const locationDesc2 = seo.productlocationdescription2?.trim() || "";

  // JSON-LD blocks strictly from DB (omit if not present)
  const videoLd = parseJsonLd(seo.VideoJsonLd);
  const logoLd = parseJsonLd(seo.LogoJsonLd);
  const breadcrumbLd = parseJsonLd((seo as any).BreadcrumbJsonLd);
  const localBusinessLd = parseJsonLd((seo as any).LocalBusinessJsonLd) ?? buildLocalBusinessLdStrict(seo);
  const productLd = parseJsonLd((seo as any).ProductJsonLd);
  const organizationLd = parseJsonLd((seo as any).OrganizationJsonLd);
  const websiteLd = parseJsonLd((seo as any).WebsiteJsonLd);
  const faqLd = parseJsonLd((seo as any).FaqJsonLd);

  return (
    <>
      {/* This tiny JSON blob lets the global Footer render related names+links. */}
      <script
        id="footer-products"
        type="application/json"
        // only names + hrefs
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(footerRelatedLinks.slice(0, 8)),
        }}
      />

      <JsonLdInjector
        videoLd={videoLd}
        logoLd={logoLd}
        breadcrumbLd={breadcrumbLd}
        localBusinessLd={localBusinessLd}
        productLd={productLd}
        organizationLd={organizationLd}
        websiteLd={websiteLd}
        faqLd={faqLd}
      />

      <main className="min-h-screen bg-white">
        {/* HERO */}
        <section className="hero relative bg-white text-slate-900 overflow-hidden pt-4 pb-8 sm:pt-8">
          <div className="relative max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
            <div className="flex flex-col lg:grid lg:grid-cols-2 gap-8 items-center">
              {/* Left Column: Text */}
              <div className="space-y-8 w-full mt-6 lg:mt-0">
                <div className="space-y-4">
                  <h1 className="text-3xl sm:text-4xl lg:text-6xl font-bold leading-tight tracking-tight">
                    {locationTitle}
                  </h1>
                  <p className="text-base sm:text-xl text-slate-600 leading-relaxed max-w-2xl">
                    {locationTagline}
                  </p>

                  <div className="bg-slate-100 rounded-lg p-4 mt-4">
                    <dl className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-baseline">
                        <dt className="text-slate-800 font-medium">SKU:</dt>
                        <dd className="ml-2 text-slate-950">{seo.sku ?? "—"}</dd>
                      </div>
                      <div className="flex items-baseline">
                        <dt className="text-slate-800 font-medium">Price:</dt>
                        <dd className="ml-2 text-slate-950">{seo.salesPrice ?? "—"}</dd>
                      </div>
                      <div className="flex items-baseline">
                        <dt className="text-slate-800 font-medium">Rating:</dt>
                        <dd className="ml-2 text-slate-950">{seo.rating_value ?? "—"}/5</dd>
                      </div>
                      <div className="flex items-baseline">
                        <dt className="text-slate-800 font-medium">Reviews:</dt>
                        <dd className="ml-2 text-slate-950">{seo.rating_count ?? "—"}</dd>
                      </div>
                    </dl>
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <a href="#contact" className="inline-flex items-center justify-center px-8 py-4 btn-primary">
                    Get Quote Now
                  </a>
                  <a href="tel:+1234567890" className="inline-flex items-center justify-center px-8 py-4 btn-secondary">
                    📞 Call Now
                  </a>
                  <a
                    href="https://n8n.egport.com/webhook/a59f3482-d830-4d83-ae0e-3e5a955350a9"
                    className="inline-flex items-center justify-center px-6 py-3 border-2 border-emerald-600 text-emerald-700 hover:bg-emerald-700 hover:text-white rounded-lg font-semibold transition-all duration-200"
                  >
                    📋 Free Catalog
                  </a>
                </div>

                <div className="flex flex-wrap gap-4 text-sm text-slate-500 mt-2">
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

              {/* Right Column: Image */}
              <div className="relative flex items-center justify-center w-full min-h-[220px] sm:min-h-[320px] lg:min-h-[400px]">
                <div className="relative z-10 w-full h-56 sm:h-80 lg:h-[420px] lg:max-w-2xl lg:aspect-[16/9] rounded-2xl overflow-hidden shadow-lg animate-shadow">
                  <Image
                    src={heroImage}
                    alt={heroAlt}
                    fill
                    priority
                    fetchPriority="high"
                    className="object-cover w-full h-full"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 40vw, 800px"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* COMPANY OVERVIEW */}
        <section className="py-20 bg-slate-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-6">
                Leading B2B Fabric Supplier Worldwide
              </h2>
              <p className="text-slate-600 mb-8">ISO 9001 Certified • 500+ Global Partners • Ships to 50+ Countries</p>
              <div className="w-24 h-1 bg-gradient-to-r from-blue-600 to-emerald-600 mx-auto mb-8" />
            </div>

            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div className="space-y-6">
                <p className="text-lg text-slate-700 leading-relaxed">{locationDesc1}</p>
                <p className="text-lg text-slate-700 leading-relaxed">{locationDesc2}</p>

                <div className="grid sm:grid-cols-2 gap-6 mt-8">
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="text-3xl font-bold text-blue-600 mb-2">500+</div>
                    <div className="text-slate-600">Global Partners</div>
                  </div>
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="text-3xl font-bold text-emerald-600 mb-2">50+</div>
                    <div className="text-slate-600">Countries Served</div>
                  </div>
                </div>
              </div>

              <div className="relative">
                <Image
                  src={overviewImage}
                  alt={overviewAlt}
                  width={600}
                  height={500}
                  loading="lazy"
                  className="rounded-2xl shadow-lg object-cover w-full h-auto"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 600px"
                />
              </div>
            </div>
          </div>
        </section>

        {/* EXPLORE OUR FABRIC CATALOG — same-location related products (excluding current) */}
        <section id="products" className="py-20 bg-white" aria-labelledby="product-categories">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 id="product-categories" className="text-3xl sm:text-4xl font-bold text-slate-900 mb-6">
                Explore Our Fabric Catalog
              </h2>
              <p className="text-xl text-slate-600 max-w-3xl mx-auto">
                {locationTagline || "Comprehensive range of premium fabrics for every manufacturing need"}
              </p>
            </div>

            {relatedProductsClean.length === 0 ? (
              <div className="text-center text-slate-600">No products for the selected location.</div>
            ) : (
              <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                {relatedProductsClean.map((p) => {
                  const img =
                    (p.img ?? p.image1 ?? p.image2 ?? "/placeholder.svg?height=300&width=400").toString();
                  const pid = String(p?._id ?? "").trim();
                  const seoSlug = slugByProduct.get(pid) || p.slug;
                  const href = seoSlug ? `/${seoSlug}` : "#";

                  const Card = (
                    <div className="relative overflow-hidden rounded-2xl shadow-lg border border-slate-100 hover:border-blue-200 transition">
                      <div className="relative w-full h-48">
                        <Image
                          src={img}
                          alt={`${p.name ?? "Fabric"} - ${p.productdescription ?? ""}`}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                        />
                      </div>
                      <div className="p-6">
                        <h3 className="text-xl font-bold text-slate-900 mb-3">{p.name ?? "Fabric"}</h3>
                        <p className="text-slate-600 line-clamp-3">{p.productdescription || "—"}</p>
                      </div>
                    </div>
                  );

                  return (
                    <article key={pid}>
                      {href === "#" ? <div className="opacity-100">{Card}</div> : <Link className="block group hover:opacity-95" href={href}>{Card}</Link>}
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
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">Get Your Custom Quote Today</h2>
              <p className="text-xl text-slate-300 max-w-3xl mx-auto">
                Connect with our fabric specialists for personalized pricing and bulk order solutions
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-16">
              <ContactForm />
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xl">📞</span>
                  </div>
                  <div>
                    <div className="text-white font-semibold">Phone</div>
                    <a href="tel:+919925155141" className="text-slate-300 hover:text-white transition-colors">
                      +91 9925155141
                    </a>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-emerald-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xl">✉️</span>
                  </div>
                  <div>
                    <div className="text-white font-semibold">Email</div>
                    <a href="mailto: rajesh.goyal@amritafashions.com" className="text-slate-300 hover:text-white transition-colors">
                      rajesh.goyal@amritafashions.com
                    </a>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xl">🏢</span>
                  </div>
                  <div>
                    <div className="text-white font-semibold">Office</div>
                    <div className="text-slate-300">
                      404, Safal Prelude, Corporate Rd, Prahlad Nagar,
                      <br /> Ahmedabad, Gujarat-380015
                    </div>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-rose-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xl">🕘</span>
                  </div>
                  <div>
                    <div className="text-white font-semibold">Hours</div>
                    <div className="text-slate-300">Mon–Sat: 9:30 AM – 7:00 PM IST</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <WhatsAppButton />
        <Chatbot />
      </main>
    </>
  );
}
