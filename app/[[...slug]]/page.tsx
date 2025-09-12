// app/[[...slug]]/page.tsx
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type React from "react";

import { WhatsAppButton } from "@/components/whatsapp-button";
import { Chatbot } from "@/components/chatbot";
import { FAQ } from "@/components/faq";
import { ContactForm } from "@/components/contact-form";
import JsonLdInjector from "@/components/json-ld-injector";
import { CatalogButton } from "@/components/catalog-button";
import { fetchSeoData } from "@/lib/seo"; // and fetchProductData (dynamic import below)
import { ContactDetails } from "@/components/contact-details";
import { CommitmentText } from "@/components/commitment-text";

/* -------------------------------------------------
   Config
-------------------------------------------------- */
const DEFAULT_LOCATION_SLUG = "ahmedabad";

/* -------------------------------------------------
   API URLs
-------------------------------------------------- */
const RAW_BASE = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") ?? "";
const SEO_URL = RAW_BASE ? `${RAW_BASE}/seo` : "";
const PRODUCT_URL = RAW_BASE ? `${RAW_BASE}/product` : "";
const LOC_URL = RAW_BASE ? `${RAW_BASE}/locations` : "";

const SEO_LIST_URL = RAW_BASE ? `${RAW_BASE}/seo` : "http://localhost:7000/landing/seo";

/** Contact endpoint */
const CONTACT_URL =
  process.env.NEXT_PUBLIC_CONTACT_URL ??
  (RAW_BASE ? `${RAW_BASE}/contacts` : "");

/* -------------------------------------------------
   AUTH HEADERS
-------------------------------------------------- */
const API_KEY = process.env.NEXT_PUBLIC_API_KEY ?? "";
const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? "";
const API_KEY_HEADER =
  process.env.NEXT_API_KEY_HEADER ??
  process.env.NEXT_PUBLIC_API_KEY_HEADER ??
  "x-api-key";
const ADMIN_EMAIL_HEADER = process.env.NEXT_PUBLIC_ADMIN_EMAIL_HEADER ?? "x-admin-email";

const authHeaders: Record<string, string> = {};
if (API_KEY) authHeaders[API_KEY_HEADER] = API_KEY;
if (ADMIN_EMAIL) authHeaders[ADMIN_EMAIL_HEADER] = ADMIN_EMAIL;

/* -------------------------------------------------
   Company ENV (Organization/LocalBusiness/Contact)
   Priority: DB → ENV → safe default
-------------------------------------------------- */
const COMPANY_NAME = process.env.NEXT_PUBLIC_COMPANY_NAME || "Amrita Fashions";
const COMPANY_EMAIL = process.env.NEXT_PUBLIC_COMPANY_EMAIL || "sales@example.com";
const COMPANY_PHONE = process.env.NEXT_PUBLIC_COMPANY_PHONE || "+91-0000000000";
const COMPANY_ADDRESS = process.env.NEXT_PUBLIC_COMPANY_ADDRESS || "";
const COMPANY_LOGO_URL =
  process.env.NEXT_PUBLIC_COMPANY_LOGO_URL ||
  "https://amritafashions.com/wp-content/uploads/amrita-fashions-small-logo-india.webp";
const COMPANY_SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || undefined;
const COMPANY_SAME_AS = (process.env.NEXT_PUBLIC_COMPANY_SAME_AS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
const COMPANY_LANGS = (process.env.NEXT_PUBLIC_COMPANY_LANGS || "English,Hindi,Gujarati")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
const COMPANY_FOUNDING_DATE = process.env.NEXT_PUBLIC_COMPANY_FOUNDING_DATE;
const COMPANY_EMPLOYEE_RANGE = process.env.NEXT_PUBLIC_COMPANY_EMPLOYEE_RANGE;
const COMPANY_AWARDS = (process.env.NEXT_PUBLIC_COMPANY_AWARDS || "")
  .split("|")
  .map((s) => s.trim())
  .filter(Boolean);

/* -------------------------------------------------
   Utilities
-------------------------------------------------- */
const norm = (s: any) => String(s ?? "").trim().toLowerCase();
const toId = (v: any) =>
  typeof v === "string" ? v.trim() : v?._id ? String(v._id).trim() : "";
const nonEmpty = (s: any) => (typeof s === "string" && s.trim().length ? s.trim() : undefined);
const asString = (v: any) => (v === undefined || v === null ? undefined : String(v));
const asBoolString = (v: any) => (v === true ? "true" : v === false ? "false" : undefined);

// phone sanitizer for tel: and JSON-LD
function sanitizeE164(s: string) {
  return s ? s.replace(/[^\d+]/g, "") : s;
}

// robust robots parser (keeps your intent if string absent)
function parseRobots(s?: string) {
  if (!s) return undefined;
  const v = s.toLowerCase();
  return {
    index: !/noindex/.test(v),
    follow: !/nofollow/.test(v),
  } as const;
}

function pick<T>(dbVal: T | undefined | null, envVal?: T, fallback?: T) {
  if (dbVal !== undefined && dbVal !== null && String(dbVal).trim() !== "") return dbVal as T;
  if (envVal !== undefined && envVal !== null && String(envVal).trim() !== "") return envVal as T;
  return fallback as T;
}

function isAssetSlug(slug?: string) {
  return !!slug && slug.includes(".");
}

function parseAddressString(addr: string) {
  if (!addr) return {} as any;
  const parts = addr.split(",").map((p) => p.trim()).filter(Boolean);
  const pinMatch = addr.match(/\b\d{5,6}\b/);
  const postalCode = pinMatch ? pinMatch[0] : undefined;
  return {
    streetAddress: parts.slice(0, 3).join(", ") || undefined,
    addressLocality: parts[3] || parts[2] || undefined,
    addressRegion: parts[4] || parts.find((p) => /gujarat/i.test(p)) || undefined,
    postalCode,
    addressCountry: "IN",
  };
}

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

/* -------------------------------------------------
   Canonical / Hreflang helpers (ENV base + SEO.slug)
-------------------------------------------------- */
const BASE_URL = (COMPANY_SITE_URL || "").replace(/\/+$/, ""); // no trailing slash

function canonicalFromSeoSlug(seoSlug?: string) {
  if (!BASE_URL) return undefined;
  const cleaned = (seoSlug || "").trim().replace(/^\/+/, "");
  return cleaned ? `${BASE_URL}/${cleaned}` : BASE_URL;
}

// Accepts only valid language codes; returns exactly ONE mapping (no x-default)
const VALID_HREFLANG = /^[a-z]{2,3}(?:-[A-Za-z0-9]{2,8})?$/i;
function pickFirstValidLang(input?: string): string | undefined {
  if (!input) return undefined;
  const tokens = input.split(/[, ]+/).map((s) => s.trim()).filter(Boolean);
  for (const t of tokens) if (VALID_HREFLANG.test(t)) return t;
  return undefined;
}
function hreflangMapFromSeo(canonical?: string, hreflang?: string) {
  if (!canonical) return undefined;
  const code = pickFirstValidLang(hreflang) || "en";
  return { [code]: canonical };
}

/* -------------------------------------------------
   Types (merged)
-------------------------------------------------- */
type ProductDoc = {
  _id: string;
  name?: string;
  slug?: string;
  img?: string;
  altimg1?: string;
  image1?: string;
  altimg2?: string;
  image2?: string;
  altimg3?: string;
  gsm?: string | number;
  oz?: string | number;
  cm?: string | number;
  inch?: string | number;
  salesPrice?: number;
  productdescription?: string;
  sku?: string;
};

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

  hreflang?: string; // e.g. "en" or "en-IN"
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

  OrganizationJsonLdname?: string;
  OrganizationJsonLdtelephone?: string;
  OrganizationJsonLdemail?: string;
  OrganizationJsonLdlogoUrl?: string;
  OrganizationJsonLdaddressstreetAddress?: string;
  OrganizationJsonLdaddressaddressLocality?: string;
  OrganizationJsonLdaddressaddressRegion?: string;
  OrganizationJsonLdaddresspostalCode?: string;
  OrganizationJsonLdaddressaddressCountry?: string;
}

/* -------------------------------------------------
   Next.js dynamic flags
-------------------------------------------------- */
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

/* -------------------------------------------------
   OG/Twitter + JSON-LD helpers (merged)
-------------------------------------------------- */
const VALID_OG_TYPES = new Set([
  "website", "article", "book", "profile", "music.song", "music.album", "music.playlist",
  "music.radio_station", "video.movie", "video.episode", "video.tv_show", "video.other",
]);
const VALID_TWITTER_CARDS = new Set(["summary", "summary_large_image", "player", "app"]);

function ogTypeSafe(v: unknown) {
  const t = String(v ?? "").toLowerCase().trim();
  return (VALID_OG_TYPES.has(t) ? t : "website") as any;
}
function twitterCardSafe(v: unknown) {
  const t = String(v ?? "").toLowerCase().trim();
  return (VALID_TWITTER_CARDS.has(t) ? (t as any) : undefined) as
    | "summary"
    | "summary_large_image"
    | "player"
    | "app"
    | undefined;
}

function buildOtherMeta(seo: any) {
  const other: Record<string, string> = {};
  const set = (name: string, value: any) => {
    const v = asString(value);
    if (v !== undefined && v !== "") other[name] = v;
  };
  set("content-language", seo.contentLanguage);
  set("x-ua-compatible", seo.xUaCompatible);
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

/* ---------- JSON-LD builders (fixed to use BASE_URL + slug) ---------- */

function buildLogoLdFromParts(seo: any) {
  if (!seo?.LogoJsonLdcontext && !seo?.LogoJsonLdtype && !seo?.logoJsonLdurl) return null;
  return {
    "@context": seo.LogoJsonLdcontext || "https://schema.org",
    "@type": seo.LogoJsonLdtype || "ImageObject",
    url: nonEmpty(seo.logoJsonLdurl) || COMPANY_LOGO_URL,
    width: nonEmpty(seo.logoJsonLdwidth),
    height: nonEmpty(seo.logoJsonLdheight),
  };
}

function buildLocalBusinessLdFromParts(seo: any) {
  const lat = parseFloat(seo?.LocalBusinessJsonLdgeoLatitude);
  const lng = parseFloat(seo?.LocalBusinessJsonLdgeoLongitude);

  const images = [seo?.ogImage, seo?.twitterImage].filter(Boolean) as string[];
  if (images.length === 0) images.push(COMPANY_LOGO_URL ?? "/placeholder.svg?height=800&width=1200");

  const addressFromEnv = parseAddressString(COMPANY_ADDRESS ?? "");

  const address = {
    "@type": "PostalAddress",
    streetAddress: pick<string>(nonEmpty(seo?.LocalBusinessJsonLdaddressstreetAddress), addressFromEnv.streetAddress as string, undefined),
    addressLocality: pick<string>(nonEmpty(seo?.LocalBusinessJsonLdaddressaddressLocality), addressFromEnv.addressLocality as string, undefined),
    addressRegion: pick<string>(nonEmpty(seo?.LocalBusinessJsonLdaddressaddressRegion), addressFromEnv.addressRegion as string, undefined),
    postalCode: pick<string>(nonEmpty(seo?.LocalBusinessJsonLdaddresspostalCode), addressFromEnv.postalCode as string, undefined),
    addressCountry: pick<string>(nonEmpty(seo?.LocalBusinessJsonLdaddressaddressCountry), addressFromEnv.addressCountry as string, "IN"),
  };

  const geo =
    Number.isFinite(lat) && Number.isFinite(lng)
      ? { "@type": "GeoCoordinates", latitude: lat, longitude: lng }
      : undefined;

  const canonical = canonicalFromSeoSlug(seo?.slug) || COMPANY_SITE_URL;

  const openingHoursSpecification = [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      opens: "09:30",
      closes: "19:00",
    },
  ];

  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: pick<string>(nonEmpty(seo?.LocalBusinessJsonLdname), COMPANY_NAME, COMPANY_NAME),
    url: canonical,
    telephone: sanitizeE164(pick<string>(nonEmpty(seo?.LocalBusinessJsonLdtelephone), COMPANY_PHONE, COMPANY_PHONE) || ""),
    email: pick<string>(nonEmpty(seo?.LocalBusinessJsonLdemail), COMPANY_EMAIL, COMPANY_EMAIL),
    address,
    geo,
    image: images,
    logo: pick<string>(nonEmpty(seo?.LocalBusinessJsonLdlogoUrl), COMPANY_LOGO_URL, COMPANY_LOGO_URL),
    description: pick<string>(nonEmpty(seo?.description), undefined, undefined),
    areaServed: pick<string>(nonEmpty(seo?.LocalBusinessJsonLdareaserved), undefined, undefined),
    openingHoursSpecification,
    priceRange: "$$",
    paymentAccepted: ["Cash", "Credit Card", "Bank Transfer"],
    currenciesAccepted: ["INR", "USD", "EUR"],
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Fabric Catalog",
      itemListElement: [{ "@type": "Offer", itemOffered: { "@type": "Product", name: "Premium Fabrics" } }],
    },
  };
}

function buildBreadcrumbLdFromParts(seo: any) {
  let productCategory = "Fabrics";
  if (seo?.slug) {
    const s = String(seo.slug).toLowerCase();
    if (s.includes("cotton")) productCategory = "Cotton Fabrics";
    else if (s.includes("silk")) productCategory = "Silk Fabrics";
    else if (s.includes("wool")) productCategory = "Wool Fabrics";
    else if (s.includes("polyester")) productCategory = "Polyester Fabrics";
    else if (s.includes("linen")) productCategory = "Linen Fabrics";
  }

  const base = (COMPANY_SITE_URL || "https://amritafashions.com").replace(/\/+$/, "");
  const canonical = canonicalFromSeoSlug(seo?.slug) || base;

  const itemListElement = [
    { "@type": "ListItem", position: 1, name: "Home", item: `${base}/` },
    { "@type": "ListItem", position: 2, name: "Products", item: `${base}/products` },
    {
      "@type": "ListItem",
      position: 3,
      name: productCategory,
      item: `${base}/products/${productCategory.toLowerCase().replace(/\s+/g, "-")}`,
    },
    {
      "@type": "ListItem",
      position: 4,
      name: nonEmpty(seo?.BreadcrumbJsonLdname) || nonEmpty(seo?.title) || productCategory,
      item: canonical,
    },
  ];

  return { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement };
}

function productJsonLd(seo: any, productName?: string) {
  const images = [seo?.ogImage, seo?.twitterImage].filter(Boolean) as string[];
  if (images.length === 0) {
    images.push(COMPANY_LOGO_URL ?? "/placeholder.svg?height=800&width=1200");
  }

  const canonical = canonicalFromSeoSlug(seo?.slug) || COMPANY_SITE_URL || "https://example.com";

  const ld: any = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: productName || nonEmpty(seo?.title),
    description: nonEmpty(seo?.description),
    sku: nonEmpty(seo?.sku) || undefined,
    brand: { "@type": "Brand", name: COMPANY_NAME },
    image: images,
    url: canonical,
    category: "Textile & Fabric",
    manufacturer: { "@type": "Organization", name: COMPANY_NAME, url: canonical },
    mpn: nonEmpty(seo?.productIdentifier) || undefined,
  };

  if (seo?.salesPrice) {
    ld.offers = {
      "@type": "Offer",
      price: seo.salesPrice,
      priceCurrency: "INR",
      availability: "https://schema.org/InStock",
      seller: { "@type": "Organization", name: COMPANY_NAME },
      priceValidUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      deliveryLeadTime: { "@type": "QuantitativeValue", value: 7, unitCode: "DAY" },
    };
  }

  if (seo?.rating_value && seo?.rating_count) {
    ld.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: seo.rating_value,
      reviewCount: seo.rating_count,
      bestRating: 5,
      worstRating: 1,
    };
  }

  if (seo?.popularproduct) {
    ld.additionalProperty = { "@type": "PropertyValue", name: "Popular Product", value: "Yes" };
  }

  return ld;
}

function organizationJsonLd(seo: any) {
  const images = [seo?.ogImage, seo?.twitterImage].filter(Boolean) as string[];
  if (images.length === 0) {
    images.push(COMPANY_LOGO_URL ?? "/placeholder.svg?height=800&width=1200");
  }

  const envAddr = parseAddressString(COMPANY_ADDRESS ?? "");

  const addr = {
    "@type": "PostalAddress",
    streetAddress: pick<string>(nonEmpty(seo?.OrganizationJsonLdaddressstreetAddress), envAddr.streetAddress as string, "404, Safal Prelude, Corporate Rd"),
    addressLocality: pick<string>(nonEmpty(seo?.OrganizationJsonLdaddressaddressLocality), envAddr.addressLocality as string, "Ahmedabad"),
    addressRegion: pick<string>(nonEmpty(seo?.OrganizationJsonLdaddressaddressRegion), envAddr.addressRegion as string, "Gujarat"),
    postalCode: pick<string>(nonEmpty(seo?.OrganizationJsonLdaddresspostalCode), envAddr.postalCode as string, "380015"),
    addressCountry: pick<string>(nonEmpty(seo?.OrganizationJsonLdaddressaddressCountry), envAddr.addressCountry as string, "IN"),
  };

  const orgUrl = canonicalFromSeoSlug(seo?.slug) || COMPANY_SITE_URL || "https://example.com";

  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${orgUrl}/#organization`,
    name: pick<string>(nonEmpty(seo?.OrganizationJsonLdname), COMPANY_NAME, COMPANY_NAME),
    url: orgUrl,
    logo: { "@type": "ImageObject", url: pick<string>(nonEmpty(seo?.OrganizationJsonLdlogoUrl), COMPANY_LOGO_URL, COMPANY_LOGO_URL), width: 131, height: 61 },
    image: images,
    description:
      nonEmpty(seo?.description) ||
      "Leading B2B Fabric Supplier Worldwide - ISO 9001 Certified • 500+ Global Partners • Ships to 50+ Countries",
    address: addr,
    contactPoint: {
      "@type": "ContactPoint",
      telephone: sanitizeE164(pick<string>(nonEmpty(seo?.OrganizationJsonLdtelephone), COMPANY_PHONE, COMPANY_PHONE) || ""),
      contactType: "customer service",
      email: pick<string>(nonEmpty(seo?.OrganizationJsonLdemail), COMPANY_EMAIL, COMPANY_EMAIL),
      availableLanguage: COMPANY_LANGS,
    },
    sameAs: (Array.isArray((seo as any)?.sameAs) && (seo as any)?.sameAs.length ? (seo as any).sameAs : COMPANY_SAME_AS) || undefined,
    ...(COMPANY_FOUNDING_DATE ? { foundingDate: COMPANY_FOUNDING_DATE } : {}),
    ...(COMPANY_EMPLOYEE_RANGE ? { numberOfEmployees: COMPANY_EMPLOYEE_RANGE } : {}),
    ...(COMPANY_AWARDS.length ? { award: COMPANY_AWARDS } : {}),
  };
}

function websiteJsonLd(seo: any) {
  const canonical = canonicalFromSeoSlug(seo?.slug) || COMPANY_SITE_URL || "https://example.com";
  const base = (COMPANY_SITE_URL || canonical).replace(/\/+$/, "");
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: COMPANY_NAME,
    url: canonical,
    description: "Leading B2B Fabric Supplier Worldwide - Premium Quality Textiles",
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: `${base}/search?q={search_term_string}` },
      "query-input": "required name=search_term_string",
    },
    publisher: { "@type": "Organization", name: COMPANY_NAME },
  };
}

function faqJsonLd() {
  const faqs = [
    { question: "What is your minimum order quantity for bulk fabric orders?", answer: "Our minimum order quantity varies by fabric type, typically starting from 500 meters for standard fabrics and 1000 meters for custom specifications." },
    { question: "Do you provide fabric samples before placing bulk orders?", answer: "Yes, we provide free fabric samples for all our products. Sample orders are processed within 3-5 business days and shipped worldwide." },
    { question: "What are your payment terms for B2B fabric orders?", answer: "We offer flexible payment terms including T/T, L/C, and for established clients, 30-60 day terms." },
    { question: "How do you ensure consistent quality across large fabric orders?", answer: "Strict QC processes including pre-production samples, in-line inspection, and final checks before shipment." },
    { question: "What is your typical lead time for fabric manufacturing and delivery?", answer: "Standard fabrics: 15-20 days, custom fabrics: 25-35 days." },
    { question: "Do you offer custom fabric development services?", answer: "Yes, we specialize in custom fabric development for clothing brands and manufacturers." },
  ];
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({ "@type": "Question", name: faq.question, acceptedAnswer: { "@type": "Answer", text: faq.answer } })),
  };
}

/* ---------- NEW: module-scoped JSON-LD aggregator (used below) ---------- */
function jsonLdFor(seoBase: any, productName?: string) {
  const videoLd = parseJsonLd(seoBase?.VideoJsonLd);
  const logoLd = parseJsonLd(seoBase?.LogoJsonLd) ?? buildLogoLdFromParts(seoBase);
  const breadcrumbLd = buildBreadcrumbLdFromParts(seoBase);
  const localBusinessLd = buildLocalBusinessLdFromParts(seoBase);
  const productLd = productJsonLd(seoBase, productName);
  const organizationLd = organizationJsonLd(seoBase);
  const websiteLd = websiteJsonLd(seoBase);
  const faqLd = faqJsonLd();
  return { videoLd, logoLd, breadcrumbLd, localBusinessLd, productLd, organizationLd, websiteLd, faqLd };
}

/* -------------------------------------------------
   Reusable UI Sections (shared by home & slug)
-------------------------------------------------- */
function SectionHero(props: {
  titleNode: React.ReactNode;
  subtitle?: string;
  sku?: string | number;
  price?: string | number;
  rating?: string | number;
  reviews?: string | number;
  phone?: string;
  heroImage: string;
  heroAlt: string;
  catalogProduct?: {
    name?: string;
    sku?: string;
    salesPrice?: number;
    productdescription?: string;
    img?: string;
    image1?: string;
    image2?: string;
    altimg1?: string;
    altimg2?: string;
    altimg3?: string;
    gsm?: string | number;
    oz?: string | number;
    cm?: string | number;
    inch?: string | number;
  };
}) {
  const { titleNode, subtitle, sku, price, rating, reviews, phone, heroImage, heroAlt, catalogProduct } = props;
  return (
    <section id="hero" className="hero relative bg-white text-slate-900 overflow-hidden pt-4 pb-8 sm:pt-8">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:grid lg:grid-cols-2 gap-8 items-center">
          {/* Left */}
          <div className="space-y-6 sm:space-y-8 w-full mt-4 sm:mt-6 lg:mt-0">
            <h1 className="font-bold leading-tight text-[clamp(1.75rem,4vw,3.75rem)] sm:text-4xl lg:text-6xl text-balance break-words">
              {titleNode}
            </h1>

            {subtitle && (
              <p className="text-base sm:text-xl text-slate-700 max-w-2xl whitespace-pre-wrap break-words">
                {subtitle}
              </p>
            )}

            {(sku !== undefined || price !== undefined || rating !== undefined || reviews !== undefined) && (
              <div className="bg-slate-100 rounded-lg p-4 grid grid-cols-2 gap-4 text-sm">
                {sku !== undefined && (
                  <div>
                    <span className="text-slate-700">SKU:</span>
                    <span className="ml-2 text-slate-900 break-words">{sku as any}</span>
                  </div>
                )}
                {price !== undefined && (
                  <div>
                    <span className="text-slate-700">Price:</span>
                    <span className="ml-2 text-slate-900">{price as any}</span>
                  </div>
                )}
                {rating !== undefined && (
                  <div>
                    <span className="text-slate-700">Rating:</span>
                    <span className="ml-2 text-slate-900">{rating as any}/5</span>
                  </div>
                )}
                {reviews !== undefined && (
                  <div>
                    <span className="text-slate-700">Reviews:</span>
                    <span className="ml-2 text-slate-900">{reviews as any}</span>
                  </div>
                )}
              </div>
            )}

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <a href="#contact" className="px-6 sm:px-8 py-3 sm:py-4 btn-primary">Get Quote Now</a>
              {phone && (
                <a href={`tel:${sanitizeE164(phone)}`} className="px-6 sm:px-8 py-3 sm:py-4 btn-secondary">
                  📞 Call Now
                </a>
              )}
              {catalogProduct && <CatalogButton product={catalogProduct} />}
            </div>

            <div className="flex flex-wrap gap-3 sm:gap-4 text-sm text-slate-700 mt-2">
              <div className="flex items-center space-x-2"><div className="w-2 h-2 bg-emerald-400 rounded-full" /><span>ISO Certified</span></div>
              <div className="flex items-center space-x-2"><div className="w-2 h-2 bg-emerald-400 rounded-full" /><span>Global Shipping</span></div>
              <div className="flex items-center space-x-2"><div className="w-2 h-2 bg-emerald-400 rounded-full" /><span>24/7 Support</span></div>
            </div>
          </div>

          {/* Right (Image) */}
          <div className="relative w-full px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
            <div className="relative z-10 w-full rounded-2xl overflow-hidden shadow-lg bg-white aspect-[16/10] sm:aspect-[5/4] lg:aspect-[16/9]">
              <Image
                key={heroImage}
                src={heroImage}
                alt={heroAlt}
                fill
                priority
                className="object-contain object-center"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 800px"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function OverviewSection(props: {
  heading?: string;
  tagline?: string;
  p1?: string;
  p2?: string;
  extraContent?: React.ReactNode;
  image: string;
  imageAlt: string;
}) {
  const { heading = "Leading B2B Fabric Supplier Worldwide", tagline, p1, p2, extraContent, image, imageAlt } = props;
  return (
    <section className="py-14 sm:py-20 bg-slate-50" id="about">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4 sm:mb-6 text-balance break-words">
            {heading}
          </h2>
          {tagline && <p className="text-slate-600 mb-6 sm:mb-8">{tagline}</p>}
          <div className="w-24 h-1 bg-gradient-to-r from-blue-600 to-emerald-600 mx-auto" />
        </div>

        <div className="grid lg:grid-cols-2 gap-10 sm:gap-16 items-center">
          <div className="space-y-6">
            {p1 && (
              <p className="text-base sm:text-lg text-slate-700 leading-relaxed whitespace-pre-wrap break-words">
                {p1}
              </p>
            )}
            {p2 && (
              <p className="text-base sm:text-lg text-slate-700 leading-relaxed whitespace-pre-wrap break-words">
                {p2}
              </p>
            )}
            {extraContent}

            <div className="grid grid-cols-2 gap-4 sm:gap-6 mt-6 sm:mt-8">
              <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-slate-200 text-center">
                <div className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">500+</div>
                <div className="text-slate-600 text-sm sm:text-base">Global Partners</div>
              </div>
              <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-slate-200 text-center">
                <div className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">50+</div>
                <div className="text-slate-600 text-sm sm:text-base">Countries Served</div>
              </div>
            </div>
          </div>

          <div className="relative rounded-2xl shadow-lg overflow-hidden bg-white aspect-[4/3] sm:aspect-[5/4] lg:aspect-[3/2] w-full">
            <Image
              key={image}
              src={image}
              alt={imageAlt}
              fill
              loading="lazy"
              className="object-contain object-center"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 600px"
            />
          </div>
        </div>
      </div>
    </section>
  );
}


function ProductGrid(props: {
  title?: string;
  subtitle?: string;
  products: ProductDoc[];
  slugByProduct: Map<string, string>;
}) {
  const { title = "Explore Our Fabric Catalog", subtitle, products, slugByProduct } = props;
  return (
    <section id="products" className="py-14 sm:py-20 bg-white" aria-labelledby="product-categories">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="text-center mb-12 sm:mb-16">
          <h2 id="product-categories" className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4 sm:mb-6 text-balance">
            {title}
          </h2>
          {subtitle && <p className="text-lg sm:text-xl text-slate-600 max-w-3xl mx-auto">{subtitle}</p>}
        </div>

        {products.length === 0 ? (
          <div className="text-center text-slate-600">No products for the selected location.</div>
        ) : (
          <div className="grid gap-6 sm:gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((p) => {
              const img = (p.img ?? p.image1 ?? p.image2 ?? "/placeholder.svg?height=300&width=400").toString();
              const pid = String(p?._id ?? "").trim();
              const rawSlug = (slugByProduct.get(pid) || p?.slug || "").toString().trim();
              const safeSlug = rawSlug.replace(/^\/+/, "");
              const href = safeSlug ? `/${encodeURIComponent(safeSlug)}` : "#";
              const desc = (p.productdescription || "").toString();

              const CardInner = (
                <div className="relative flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-lg border border-slate-100 hover:shadow-xl hover:border-blue-200 transition-all duration-200">
                  {/* Image */}
                  <div className="relative w-full aspect-[4/3] bg-white">
                    <Image
                      src={img}
                      alt={p.name || "Fabric"}
                      fill
                      className="object-contain object-center"
                      loading="lazy"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    />
                  </div>

                  {/* Content */}
                  <div className="flex flex-1 flex-col p-5 sm:p-6">
                    <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2 line-clamp-2 break-words">
                      {p.name ?? "Fabric"}
                    </h3>

                    <p className="text-slate-600 text-sm sm:text-base line-clamp-3">
                      {desc || "—"}
                    </p>

                    {/* NOTE: Avoid nested <a>. This is a styled span now. */}
                    {href !== "#" && (
                      <span
                        className="mt-3 inline-flex items-center font-semibold text-blue-700 group-hover:text-blue-800"
                        aria-hidden="true"
                      >
                        Read more →
                      </span>
                    )}
                  </div>
                </div>
              );

              return (
                <article key={pid} className="h-full">
                  {href === "#" ? (
                    <div className="opacity-100 h-full">{CardInner}</div>
                  ) : (
                    <Link className="group block h-full" href={href}>
                      {CardInner}
                    </Link>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}


function ContactSection() {
  return (
    <>
      <FAQ />
      <section id="contact" className="py-14 sm:py-20 bg-slate-900">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6 text-center text-balance">
            Get Your Custom Quote Today
          </h2>
          <div className="grid lg:grid-cols-2 gap-10 sm:gap-16 ">
            <ContactForm />
            <ContactDetails />
          </div>
        </div>
      </section>
      <WhatsAppButton />
      {/* <Chatbot /> */}
    </>
  );
}

/* -------------------------------------------------
   Props (optional catch-all)
-------------------------------------------------- */
type Props = { params: Promise<{ slug?: string[] }> };

/* -------------------------------------------------
   Metadata (home vs slug)
-------------------------------------------------- */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await params;
  const slugSegs = p.slug ?? [];
  const firstSeg = slugSegs[0];

  // ---------- HOME ----------
  if (!firstSeg) {
    const seoJson = await fetchJson<any>(SEO_URL);
    const locJson = await fetchJson<any>(LOC_URL);

    const seos: any[] = Array.isArray(seoJson?.data) ? seoJson.data : [];
    const rawLocs = (locJson?.data?.locations ?? locJson?.data ?? locJson?.locations) ?? [];
    const locs: any[] = Array.isArray(rawLocs) ? rawLocs : [];

    const targetLocIds = new Set<string>(
      locs
        .filter((l) => norm(l?.name) === DEFAULT_LOCATION_SLUG || norm(l?.slug) === DEFAULT_LOCATION_SLUG)
        .map((l) => String(l?._id ?? "").trim())
        .filter(Boolean)
    );

    const seoData =
      seos.find((s) => isSeoForLocation(s, targetLocIds, DEFAULT_LOCATION_SLUG)) || seos[0] || null;

    if (!seoData) return {};

    const title = seoData.title || "Premium Fabric";
    const desc = seoData.description || "High-quality fabric for garment manufacturing.";

    const canonical = canonicalFromSeoSlug(seoData?.slug);
    const origin = (BASE_URL || "https://example.com");
    const ogType = seoData.ogType ? ogTypeSafe(seoData.ogType) : (seoData.ogVideoUrl ? "video.other" : "website");

    return {
      title,
      description: desc,
      keywords:
        seoData.keywords?.split(",").map((k: string) => k.trim()).filter(Boolean) ||
        ["fabric", "textile", "garment", "wholesale", "manufacturer"],
      metadataBase: new URL(origin),
      applicationName: seoData.ogSiteName || COMPANY_NAME,
      authors: seoData.author_name ? [{ name: seoData.author_name }] : undefined,
      creator: seoData.author_name,
      publisher: seoData.ogSiteName || COMPANY_NAME,
      generator: "Next.js",
      referrer: "origin-when-cross-origin",
      robots: parseRobots(seoData.robots),
      viewport: { width: "device-width", initialScale: 1 },
      formatDetection: {
        email: false,
        address: false,
        telephone: seoData.formatDetection === "telephone=no" ? false : true,
      },
      verification:
        seoData.googleSiteVerification || seoData.msValidate
          ? {
              google: seoData.googleSiteVerification,
              other: seoData.msValidate ? { "msvalidate.01": seoData.msValidate } : undefined,
            }
          : undefined,
      themeColor: seoData.themeColor || "#ffffff",
      appleWebApp: seoData.mobileWebAppCapable
        ? {
            capable: seoData.mobileWebAppCapable === "yes",
            statusBarStyle: (seoData.appleStatusBarStyle as any) || "default",
          }
        : undefined,
      openGraph: {
        url: canonical,
        siteName: seoData.ogSiteName || COMPANY_NAME,
        locale: seoData.ogLocale || "en_US",
        title,
        description: desc,
        type: ogType as any,
        images: seoData.ogImage
          ? [{ url: seoData.ogImage, width: 1200, height: 630, alt: title }]
          : [],
        videos: seoData.ogVideoUrl
          ? [
              {
                url: seoData.ogVideoUrl,
                secureUrl: seoData.ogVideoSecureUrl,
                type: seoData.ogVideoType as any,
                width: seoData.ogVideoWidth,
                height: seoData.ogVideoHeight,
              },
            ]
          : [],
      },
      twitter: {
        card: twitterCardSafe(seoData.twitterCard) || "summary_large_image",
        site: seoData.twitterSite || "@ageb",
        title,
        description: desc,
        images: seoData.twitterImage ? [{ url: seoData.twitterImage }] : undefined,
      },
      alternates: {
        canonical,
        languages: hreflangMapFromSeo(canonical, seoData?.hreflang),
      },
      other: buildOtherMeta(seoData),
    };
  }

  // ---------- SLUG DETAIL ----------
  if (isAssetSlug(firstSeg)) return {};
  const seo = (await fetchSeoData(firstSeg)) as SeoDocFull | null;
  if (!seo) {
    return { title: "Page Not Found", description: "The requested page could not be found." };
  }

  const title = seo.title;
  const desc = seo.description;

  const canonical = canonicalFromSeoSlug(seo?.slug);
  const origin = BASE_URL || (canonical || "https://example.com").split("/").slice(0, 3).join("/");
  const ogType = seo.ogType ? ogTypeSafe(seo.ogType) : (seo.ogVideoUrl ? "video.other" : "website");
  const ogImageAlt = seo.ogTitle || seo.title || "Product image";

  return {
    title,
    description: desc,
    keywords: seo.keywords?.split(",").map((k) => k.trim()).filter(Boolean),
    metadataBase: new URL(origin),
    applicationName: seo.ogSiteName || COMPANY_NAME,
    authors: seo.author_name ? [{ name: seo.author_name }] : undefined,
    creator: seo.author_name,
    publisher: seo.ogSiteName || COMPANY_NAME,
    generator: "Next.js",
    referrer: "origin-when-cross-origin",
    robots: parseRobots(seo.robots),
    viewport: { width: "device-width", initialScale: 1 },
    formatDetection: {
      email: false,
      address: false,
      telephone: seo.formatDetection === "telephone=no" ? false : true,
    },
    verification:
      seo.googleSiteVerification || seo.msValidate
        ? {
            google: seo.googleSiteVerification,
            other: seo.msValidate ? { "msvalidate.01": seo.msValidate } : undefined,
          }
        : undefined,
    themeColor: seo.themeColor || "#ffffff",
    appleWebApp: seo.mobileWebAppCapable
      ? {
          capable: seo.mobileWebAppCapable === "yes",
          statusBarStyle: (seo.appleStatusBarStyle as any) || "default",
        }
      : undefined,
    openGraph: {
      url: canonical,
      siteName: seo.ogSiteName || COMPANY_NAME,
      locale: seo.ogLocale,
      title: title,
      description: desc,
      type: ogType as any,
      images: seo.ogImage ? [{ url: seo.ogImage, width: 1200, height: 630, alt: ogImageAlt }] : undefined,
    },
    twitter: {
      card: (twitterCardSafe(seo.twitterCard) as any) || "summary",
      site: seo.twitterSite,
      title: seo.twitterTitle || title,
      description: seo.twitterDescription || desc,
      images: seo.twitterImage ? [seo.twitterImage] : undefined,
    },
    alternates: {
      canonical,
      languages: hreflangMapFromSeo(canonical, seo?.hreflang),
    },
    other: buildOtherMeta(seo),
  };
}

/* -------------------------------------------------
   Page (branching UI, reusing sections)
-------------------------------------------------- */


export default async function Page({ params }: Props) {
  const p = await params;
  const slugSegs = p.slug ?? [];
  const slug = slugSegs[0];

  /* ============================
     HOME (no slug)
  ============================ */
  if (!slug) {
    const [seoJson, prodJson, locJson] = await Promise.all([
      fetchJson<any>(SEO_URL),
      fetchJson<any>(PRODUCT_URL),
      fetchJson<any>(LOC_URL),
    ]);

    const seos: any[] = Array.isArray(seoJson?.data) ? seoJson.data : [];
    const products: any[] = Array.isArray(prodJson?.data) ? prodJson.data : [];

    const rawLocs = (locJson?.data?.locations ?? locJson?.data ?? locJson?.locations) ?? [];
    const locs: any[] = Array.isArray(rawLocs) ? rawLocs : [];

    const targetLocIds = new Set<string>(
      locs
        .filter((l) => norm(l?.name) === DEFAULT_LOCATION_SLUG || norm(l?.slug) === DEFAULT_LOCATION_SLUG)
        .map((l) => String(l?._id ?? "").trim())
        .filter(Boolean),
    );

    const locSeoRows = seos.filter((s) => isSeoForLocation(s, targetLocIds, DEFAULT_LOCATION_SLUG));

    const productById = new Map<string, any>();
    const productBySlug = new Map<string, any>();
    for (const p of products) {
      const pid = String(p?._id ?? "").trim();
      if (pid) productById.set(pid, p);
      const pslug = String(p?.slug ?? "").trim().toLowerCase();
      if (pslug) productBySlug.set(pslug, p);
    }

    const ahmedabadProducts: any[] = [];
    const seen = new Set<string>();
    for (const s of locSeoRows) {
      const pid = toId(s?.product);
      const sSlug = norm(s?.slug);
      let prod: any | undefined = undefined;
      if (pid && productById.has(pid)) prod = productById.get(pid);
      else if (sSlug && productBySlug.has(sSlug)) prod = productBySlug.get(sSlug);
      if (prod) {
        const key = String(prod._id);
        if (!seen.has(key)) {
          seen.add(key);
          ahmedabadProducts.push(prod);
        }
      }
    }

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

    const firstCard = ahmedabadProducts[0] || products[0] || null;
    const firstCardSeo =
      seos.find(
        (s) =>
          isSeoForLocation(s, targetLocIds, DEFAULT_LOCATION_SLUG) &&
          (toId(s.product) === (firstCard?._id ?? "") || norm(s.slug) === norm(firstCard?.slug)),
      ) ||
      seos.find(
        (s) => toId(s.product) === (firstCard?._id ?? "") || norm(s.slug) === norm(firstCard?.slug),
      ) ||
      locSeoRows[0] ||
      seos[0] ||
      null;

    const titleFromSeo = String(firstCardSeo?.productlocationtitle ?? "").trim();
    const taglineFromSeo = String(firstCardSeo?.productlocationtagline ?? "").trim();
    const desc1FromSeo = String(firstCardSeo?.productlocationdescription1 ?? "").trim();
    const desc2FromSeo = String(firstCardSeo?.productlocationdescription2 ?? "").trim();

    const heroImage = pickImage(firstCard?.img, firstCard?.image1, firstCard?.image2);
    const heroName = (firstCard?.name || "Fabrics").toString();
    const heroAlt = heroName;
    const overviewImage = pickImageNotEq(heroImage, firstCard?.image2, firstCard?.image1, firstCard?.img);
    const overviewAlt = firstCard?.name ? `${firstCard.name} — secondary view` : "";

    const ld = jsonLdFor(firstCardSeo || seos[0] || {}, firstCard?.name);

    const titleNode: React.ReactNode = titleFromSeo ? (
      titleFromSeo
    ) : (
      <>
        Premium{" "}
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-emerald-700">
          {heroName}
        </span>{" "}
        for Global Manufacturers
      </>
    );

    return (
      <main className="min-h-screen bg-white pb-24 md:pb-0 overflow-x-hidden">
        {/* Structured data */}
        <JsonLdInjector {...ld} />

        <SectionHero
          titleNode={titleNode}
          subtitle={taglineFromSeo || "Connect with leading fabric suppliers worldwide. Quality textiles, competitive pricing, and reliable supply chains."}
          sku={firstCardSeo?.sku}
          price={firstCardSeo?.salesPrice}
          rating={firstCardSeo?.rating_value}
          reviews={firstCardSeo?.rating_count}
          phone={COMPANY_PHONE}
          heroImage={heroImage}
          heroAlt={heroAlt}
          catalogProduct={{
            name: firstCard?.name,
            sku: firstCard?.sku || firstCardSeo?.sku,
            salesPrice: firstCard?.salesPrice || firstCardSeo?.salesPrice,
            productdescription: firstCard?.productdescription || firstCardSeo?.productdescription,
            img: firstCard?.img,
            altimg1:firstCard?.altimg2,
            altimg2:firstCard?.altimg1,
            altimg3:firstCard?.altimg3,
            image1: firstCard?.image1,
            image2: firstCard?.image2,
            gsm: firstCard?.gsm,
            oz: firstCard?.oz,
            cm: firstCard?.cm,
            inch: firstCard?.inch,
          }}
        />

        <OverviewSection
          tagline="ISO 9001 Certified • 500+ Global Partners • Ships to 50+ Countries"
         p1={desc1FromSeo || undefined}
        p2={desc2FromSeo || undefined}
          extraContent={<CommitmentText />}
          image={overviewImage}
          imageAlt={overviewAlt}
        />

        <ProductGrid
          subtitle={taglineFromSeo || "Comprehensive range of premium fabrics for every manufacturing need"}
          products={ahmedabadProducts}
          slugByProduct={slugByProduct}
        />

        <ContactSection />
      </main>
    );
  }

  /* ============================
     SLUG DETAIL: product page
  ============================ */
  if (isAssetSlug(slug)) return null;

  const [{ fetchProductData }] = await Promise.all([import("@/lib/seo")]);
  const [rawSeo, productsArr] = await Promise.all([fetchSeoData(slug), fetchProductData()]);
  if (!rawSeo) notFound();
  const seo = rawSeo as SeoDocFull;

  // RELATED (same location)
  const currentLocId = toId(seo.location);
  const currentLocCode = norm(seo.locationCode);

  const seoListJson = await fetchJson<any>(SEO_LIST_URL);
  const allSeos: SeoDocFull[] = Array.isArray(seoListJson?.data) ? seoListJson.data : [];

  const relatedProductIds = new Set<string>();
  const slugByProduct = new Map<string, string>();
  for (const s of allSeos) {
    const locId = toId(s.location);
    const locCode = norm(s.locationCode);
    const pid = toId(s.product);
    const sSlug = String(s?.slug ?? "").trim();

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

  // Linked product for hero images
  const linkedProductId =
    typeof seo.product === "string" ? seo.product.trim() : (seo.product as any)?._id ? String((seo.product as any)._id).trim() : "";
  const matchingProduct: ProductDoc | null = allProducts.find((p) => p._id === linkedProductId) || null;

  // HERO / overview images
  let heroImage = "/placeholder.svg?height=600&width=800";
  let heroAlt = "Premium fabric warehouse with organized textile rolls";
  if (matchingProduct?.img) {
    heroImage = matchingProduct.img;
    heroAlt = matchingProduct.altimg1 || heroAlt;
  }
  const overviewImage =
    (matchingProduct?.image2 ||
      matchingProduct?.image1 ||
      matchingProduct?.img ||
      "/placeholder.svg?height=500&width=600") as string;
  const overviewAlt = matchingProduct?.altimg2
    ? `${matchingProduct.altimg2}`
    : "Modern textile manufacturing facility";

  // dynamic copy
  const locationTitle = seo.productlocationtitle?.trim() || "";
  const locationTagline = seo.productlocationtagline?.trim() || "";
  const locationDesc1 = seo.productlocationdescription1?.trim() || "";
  const locationDesc2 = seo.productlocationdescription2?.trim() || "";

  // JSON-LD blocks for slug
  const ld = jsonLdFor(seo, matchingProduct?.name);

  return (
    <>
      <JsonLdInjector {...ld} />

      <main className="min-h-screen bg-white overflow-x-hidden">
        <SectionHero
          titleNode={<>{locationTitle}</>}
          subtitle={locationTagline}
          sku={seo.sku}
          price={seo.salesPrice}
          rating={seo.rating_value}
          reviews={seo.rating_count}
          phone={COMPANY_PHONE}
          heroImage={heroImage}
          heroAlt={heroAlt}
          catalogProduct={{
            name: matchingProduct?.name,
            sku: matchingProduct?.sku || seo.sku,
            salesPrice: matchingProduct?.salesPrice || seo.salesPrice,
            productdescription: matchingProduct?.productdescription || seo.productdescription,
            img: matchingProduct?.img,
            image1: matchingProduct?.image1,
            image2: matchingProduct?.image2,
            gsm: matchingProduct?.gsm,
            oz: matchingProduct?.oz,
            cm: matchingProduct?.cm,
            inch: matchingProduct?.inch,
          }}
        />

        <OverviewSection
          heading="Leading B2B Fabric Supplier Worldwide"
          p1={locationDesc1}
          p2={locationDesc2}
          extraContent={<CommitmentText />}
          image={overviewImage}
          imageAlt={overviewAlt}
        />

        <ProductGrid
          subtitle={locationTagline || "Comprehensive range of premium fabrics for every manufacturing need"}
          products={relatedProducts}
          slugByProduct={slugByProduct}
        />

        <ContactSection />
      </main>
    </>
  );
}

/* -------------------------------------------------
   Server actions
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
      headers: { "Content-Type": "application/json", ...authHeaders },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { ok: false as const, status: res.status, message: err?.message || "Failed to create contact", error: err?.error };
    }

    const json = await res.json().catch(() => ({}));
    return { ok: true as const, status: 201, message: json?.message || "Contact created successfully", data: json?.data ?? null };
  } catch (e: any) {
    return { ok: false as const, status: 500, message: "Network/Server error while creating contact", error: e?.message };
  }
}
