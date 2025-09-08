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
const SEO_URL = RAW_BASE ? `${RAW_BASE}/seo` : "";
const PRODUCT_URL = RAW_BASE ? `${RAW_BASE}/product` : "";
const LOC_URL = RAW_BASE ? `${RAW_BASE}/locations` : "";

/** Contact endpoint */
const CONTACT_URL =
  process.env.NEXT_PUBLIC_CONTACT_URL ??
  (RAW_BASE ? `${RAW_BASE}/contacts` : "");

/* -------------------------------------------------
   AUTH HEADERS
-------------------------------------------------- */
const API_KEY = process.env.NEXT_PUBLIC_API_KEY ?? "";
const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? "";
const API_KEY_HEADER = process.env.NEXT_PUBLIC_API_KEY_HEADER ?? "x-api-key";
const ADMIN_EMAIL_HEADER = process.env.NEXT_PUBLIC_ADMIN_EMAIL_HEADER ?? "x-admin-email";

const authHeaders: Record<string, string> = {};
if (API_KEY) authHeaders[API_KEY_HEADER] = API_KEY;
if (ADMIN_EMAIL) authHeaders[ADMIN_EMAIL_HEADER] = ADMIN_EMAIL;

/* -------------------------------------------------
   Company ENV (Organization/LocalBusiness/Contact)
   DB → ENV → default priority
-------------------------------------------------- */
const COMPANY_NAME = process.env.NEXT_PUBLIC_COMPANY_NAME;
const COMPANY_EMAIL = process.env.NEXT_PUBLIC_COMPANY_EMAIL;
const COMPANY_PHONE = process.env.NEXT_PUBLIC_COMPANY_PHONE;
const COMPANY_ADDRESS = process.env.NEXT_PUBLIC_COMPANY_ADDRESS;
const COMPANY_LOGO_URL = process.env.NEXT_PUBLIC_COMPANY_LOGO_URL;
const COMPANY_SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || undefined;
const COMPANY_SAME_AS = (process.env.NEXT_PUBLIC_COMPANY_SAME_AS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
const COMPANY_LANGS = (process.env.NEXT_PUBLIC_COMPANY_LANGS || "")
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
   Helpers
-------------------------------------------------- */
const toId = (v: any) =>
  typeof v === "string" ? v.trim() : v?._id ? String(v._id).trim() : "";

const norm = (s: any) => String(s ?? "").trim().toLowerCase();
const nonEmpty = (s: any) => (typeof s === "string" && s.trim().length ? s.trim() : undefined);
const asString = (v: any) => (v === undefined || v === null ? undefined : String(v));
const asBoolString = (v: any) => (v === true ? "true" : v === false ? "false" : undefined);

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

/** Pick with priority: DB → ENV → fallback */
function pick<T>(dbVal: T | undefined | null, envVal?: T, fallback?: T) {
  if (dbVal !== undefined && dbVal !== null && String(dbVal).trim() !== "") return dbVal as T;
  if (envVal !== undefined && envVal !== null && String(envVal).trim() !== "") return envVal as T;
  return fallback as T;
}

/** Parse a single-line address from env into schema parts (best-effort) */
function parseAddressString(addr: string) {
  if (!addr) return {} as any;
  const parts = addr.split(",").map((p) => p.trim()).filter(Boolean);
  const pinMatch = addr.match(/\b\d{5,6}\b/);
  const postalCode = pinMatch ? pinMatch[0] : undefined;
  return {
    streetAddress: parts.slice(0, 3).join(", ") || undefined,
    addressLocality: parts[3] || parts[2] || undefined,
    addressRegion: parts.find((p) => /gujarat/i.test(p)) || parts[4] || undefined,
    postalCode,
    addressCountry: "IN",
  };
}

/* -------------------------------------------------
   Metadata helpers (same as slug page)
-------------------------------------------------- */
const VALID_OG_TYPES = new Set([
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
function ogTypeSafe(v: unknown) {
  const t = String(v ?? "").toLowerCase().trim();
  return (VALID_OG_TYPES.has(t) ? t : "website") as any;
}

const VALID_TWITTER_CARDS = new Set(["summary", "summary_large_image", "player", "app"]);
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
  // Only include fields that are NOT already covered by Next Metadata API.
  // Removed here: charset, keywords, robots, google-site-verification, msvalidate.01,
  // theme-color, apple-mobile-web-app-capable, apple-mobile-web-app-status-bar-style,
  // format-detection, hreflang, x-default (handled via Metadata.alternates)
  const other: Record<string, string> = {};
  const set = (name: string, value: any) => {
    const v = asString(value);
    if (v !== undefined && v !== "") other[name] = v;
  };

  // Keep only things that don't have first-class Metadata keys:
  set("content-language", seo.contentLanguage);          // OK to keep
  set("author_name", seo.author_name);                   // custom helper/meta

  // IDs & custom SEO diagnostics
  set("seo:product", typeof seo.product === "string" ? seo.product : seo?.product?._id);
  set("seo:location", typeof seo.location === "string" ? seo.location : seo?.location?._id);
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

  return other;
}

/* ---------- JSON-LD helpers ---------- */
function parseJsonLd(input?: string) {
  if (!input || typeof input !== "string") return null;
  try {
    const j = JSON.parse(input);
    return j && typeof j === "object" ? j : null;
  } catch {
    return null;
  }
}

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

/** ENV-aware LocalBusiness (DB → ENV → default) */
function buildLocalBusinessLdFromParts(seo: any) {
  const lat = parseFloat(seo?.LocalBusinessJsonLdgeoLatitude);
  const lng = parseFloat(seo?.LocalBusinessJsonLdgeoLongitude);

  const images = [seo?.ogImage, seo?.twitterImage].filter(Boolean) as string[];
  if (images.length === 0) images.push(COMPANY_LOGO_URL ?? "/placeholder.svg?height=800&width=1200");

  const addressFromEnv = parseAddressString(COMPANY_ADDRESS ?? "");

  const address = {
    "@type": "PostalAddress",
    streetAddress: pick<string>(
      nonEmpty(seo?.LocalBusinessJsonLdaddressstreetAddress),
      addressFromEnv.streetAddress as string,
      undefined
    ),
    addressLocality: pick<string>(
      nonEmpty(seo?.LocalBusinessJsonLdaddressaddressLocality),
      addressFromEnv.addressLocality as string,
      undefined
    ),
    addressRegion: pick<string>(
      nonEmpty(seo?.LocalBusinessJsonLdaddressaddressRegion),
      addressFromEnv.addressRegion as string,
      undefined
    ),
    postalCode: pick<string>(
      nonEmpty(seo?.LocalBusinessJsonLdaddresspostalCode),
      addressFromEnv.postalCode as string,
      undefined
    ),
    addressCountry: pick<string>(
      nonEmpty(seo?.LocalBusinessJsonLdaddressaddressCountry),
      addressFromEnv.addressCountry as string,
      "IN"
    ),
  };

  const geo =
    Number.isFinite(lat) && Number.isFinite(lng)
      ? { "@type": "GeoCoordinates", latitude: lat, longitude: lng }
      : undefined;

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
    url: pick<string>(nonEmpty(seo?.canonical_url), COMPANY_SITE_URL, undefined),
    telephone: pick<string>(nonEmpty(seo?.LocalBusinessJsonLdtelephone), COMPANY_PHONE, COMPANY_PHONE),
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
    const s = String(seo.slug);
    if (s.includes("cotton")) productCategory = "Cotton Fabrics";
    else if (s.includes("silk")) productCategory = "Silk Fabrics";
    else if (s.includes("wool")) productCategory = "Wool Fabrics";
    else if (s.includes("polyester")) productCategory = "Polyester Fabrics";
    else if (s.includes("linen")) productCategory = "Linen Fabrics";
  }

  const itemListElement = [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://amritafashions.com" },
    { "@type": "ListItem", position: 2, name: "Products", item: "https://amritafashions.com/products" },
    {
      "@type": "ListItem",
      position: 3,
      name: productCategory,
      item: `https://amritafashions.com/products/${productCategory.toLowerCase().replace(/\s+/g, "-")}`,
    },
    {
      "@type": "ListItem",
      position: 4,
      name: nonEmpty(seo?.BreadcrumbJsonLdname) || nonEmpty(seo?.title),
      item: nonEmpty(seo?.canonical_url),
    },
  ];

  return { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement };
}

function productJsonLd(seo: any, productName?: string) {
  const images = [seo?.ogImage, seo?.twitterImage].filter(Boolean) as string[];
  if (images.length === 0) {
    images.push(COMPANY_LOGO_URL ?? "/placeholder.svg?height=800&width=1200");
  }

  const ld: any = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: productName || nonEmpty(seo?.title),
    description: nonEmpty(seo?.description),
    sku: nonEmpty(seo?.sku) || undefined,
    brand: { "@type": "Brand", name: COMPANY_NAME },
    image: images,
    url: nonEmpty(seo?.canonical_url) || COMPANY_SITE_URL,
    category: "Textile & Fabric",
    manufacturer: { "@type": "Organization", name: COMPANY_NAME, url: nonEmpty(seo?.canonical_url) || COMPANY_SITE_URL || "https://example.com" },
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

/** ENV-aware Organization (DB → ENV → default) */
function organizationJsonLd(seo: any) {
  const images = [seo?.ogImage, seo?.twitterImage].filter(Boolean) as string[];
  if (images.length === 0) {
    images.push(COMPANY_LOGO_URL ?? "/placeholder.svg?height=800&width=1200");
  }

  const orgName = pick<string>(nonEmpty(seo?.OrganizationJsonLdname), COMPANY_NAME, "Amrita Fashions");
  const url = pick<string>(nonEmpty(seo?.canonical_url), COMPANY_SITE_URL, "https://example.com");
  const description = nonEmpty(seo?.description);
  const sameAs = Array.isArray(seo?.sameAs) && seo.sameAs.length ? seo.sameAs : COMPANY_SAME_AS;

  const envAddr = parseAddressString(COMPANY_ADDRESS ?? "");

  const addr = {
    "@type": "PostalAddress",
    streetAddress: pick<string>(
      nonEmpty(seo?.OrganizationJsonLdaddressstreetAddress),
      envAddr.streetAddress as string,
      "404, Safal Prelude, Corporate Rd"
    ),
    addressLocality: pick<string>(
      nonEmpty(seo?.OrganizationJsonLdaddressaddressLocality),
      envAddr.addressLocality as string,
      "Ahmedabad"
    ),
    addressRegion: pick<string>(
      nonEmpty(seo?.OrganizationJsonLdaddressaddressRegion),
      envAddr.addressRegion as string,
      "Gujarat"
    ),
    postalCode: pick<string>(
      nonEmpty(seo?.OrganizationJsonLdaddresspostalCode),
      envAddr.postalCode as string,
      "380015"
    ),
    addressCountry: pick<string>(
      nonEmpty(seo?.OrganizationJsonLdaddressaddressCountry),
      envAddr.addressCountry as string,
      "IN"
    ),
  };

  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: orgName,
    url,
    logo: { "@type": "ImageObject", url: pick<string>(nonEmpty(seo?.OrganizationJsonLdlogoUrl), COMPANY_LOGO_URL, COMPANY_LOGO_URL), width: 131, height: 61 },
    image: images,
    description,
    address: addr,
    contactPoint: {
      "@type": "ContactPoint",
      telephone: pick<string>(nonEmpty(seo?.OrganizationJsonLdtelephone), COMPANY_PHONE, COMPANY_PHONE),
      contactType: "customer service",
      email: pick<string>(nonEmpty(seo?.OrganizationJsonLdemail), COMPANY_EMAIL, COMPANY_EMAIL),
      availableLanguage: COMPANY_LANGS,
    },
    sameAs: sameAs && sameAs.length ? sameAs : undefined,
    ...(COMPANY_FOUNDING_DATE ? { foundingDate: COMPANY_FOUNDING_DATE } : {}),
    ...(COMPANY_EMPLOYEE_RANGE ? { numberOfEmployees: COMPANY_EMPLOYEE_RANGE } : {}),
    ...(COMPANY_AWARDS.length ? { award: COMPANY_AWARDS } : {}),
  };
}

function websiteJsonLd(_: any) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: COMPANY_NAME,
    url: _?.canonical_url || COMPANY_SITE_URL || "https://example.com",
    description: "Leading B2B Fabric Supplier Worldwide - Premium Quality Textiles",
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: "https://amritafashions.com/search?q={search_term_string}" },
      "query-input": "required name=search_term_string",
    },
    publisher: { "@type": "Organization", name: COMPANY_NAME },
  };
}

function faqJsonLd() {
  const faqs = [
    {
      question: "What is your minimum order quantity for bulk fabric orders?",
      answer:
        "Our minimum order quantity varies by fabric type, typically starting from 500 meters for standard fabrics and 1000 meters for custom specifications. We work with garment manufacturers and retailers of all sizes to accommodate their specific needs.",
    },
    {
      question: "Do you provide fabric samples before placing bulk orders?",
      answer:
        "Yes, we provide free fabric samples for all our products. Sample orders are processed within 3-5 business days and shipped worldwide. This allows fabric importers and manufacturers to evaluate quality before committing to larger orders.",
    },
    {
      question: "What are your payment terms for B2B fabric orders?",
      answer:
        "We offer flexible payment terms including T/T (Telegraphic Transfer), L/C (Letter of Credit), and for established clients, we provide 30-60 day payment terms. All transactions are secure and comply with international trade regulations.",
    },
    {
      question: "How do you ensure consistent quality across large fabric orders?",
      answer:
        "We maintain strict quality control processes including pre-production samples, in-line inspection during manufacturing, and final quality checks before shipment. All our facilities are ISO certified and follow international quality standards.",
    },
    {
      question: "What is your typical lead time for fabric manufacturing and delivery?",
      answer:
        "Lead times vary based on fabric type and order quantity. Standard fabrics: 15-20 days, custom fabrics: 25-35 days. We provide detailed production schedules and regular updates throughout the manufacturing process.",
    },
    {
      question: "Do you offer custom fabric development services?",
      answer:
        "Yes, we specialize in custom fabric development for clothing brands and manufacturers. Our R&D team works closely with clients to develop unique fabric compositions, colors, and finishes that meet specific requirements.",
    },
  ];

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };
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
    seos.find((s) => isSeoForLocation(s, targetLocIds, DEFAULT_LOCATION_SLUG)) || seos[0] || null;

  if (!seoData) return {};

  const metadata: Metadata = {
    title: seoData.title || "Premium Fabric",
    description: seoData.description || "High-quality fabric for garment manufacturing.",
    keywords:
      seoData.keywords?.split(",").map((k: string) => k.trim()).filter(Boolean) ||
      ["fabric", "textile", "garment", "wholesale", "manufacturer"],
    metadataBase: new URL(seoData.canonical_url || COMPANY_SITE_URL || "https://example.com"),
    applicationName: seoData.ogSiteName || COMPANY_NAME,
    authors: seoData.author_name ? [{ name: seoData.author_name }] : undefined,
    creator: seoData.author_name,
    publisher: seoData.ogSiteName || COMPANY_NAME,
    generator: "Next.js",
    referrer: "origin-when-cross-origin",
    robots: seoData.robots ? { index: true, follow: true } : undefined,
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
      url: seoData.ogUrl || COMPANY_SITE_URL || "https://example.com/premium-cotton-ic",
      siteName: seoData.ogSiteName || COMPANY_NAME,
      locale: seoData.ogLocale || "en_US",
      title: seoData.ogTitle || "Premium Cotton Fabric",
      description: seoData.ogDescription || "High-quality fabric for B2B customers.",
      type: ogTypeSafe(seoData.ogType) as any,
      images: seoData.ogImage
        ? [{ url: seoData.ogImage, width: 1200, height: 630, alt: seoData.ogTitle || "Premium Cotton Fabric" }]
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
      title: seoData.twitterTitle || "Premium",
      description: seoData.twitterDescription || "High-quality cotton wholesale prices.",
      images: seoData.twitterImage ? [{ url: seoData.twitterImage }] : [],
    },
    alternates: (() => {
      const canonicalUrl = seoData.canonical_url
        ? new URL(seoData.canonical_url).toString()
        : COMPANY_SITE_URL || "https://example.com/premium-cotton-fabric";
      return {
        canonical: canonicalUrl,
        languages: {
          en: canonicalUrl,
          "x-default": seoData.x_default || COMPANY_SITE_URL || "https://example.com",
        },
      };
    })(),
    other: buildOtherMeta(seoData),
  };

  return metadata;
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

  // Collect target location ids
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

  // Join SEO↔Product by productId OR slug
  const ahmedabadProducts: any[] = [];
  const seen = new Set<string>();
  for (const s of locSeoRows) {
    const pid = toId(s?.product);
    const sSlug = norm(s?.slug);
    let p: any | undefined = undefined;

    if (pid && productById.has(pid)) p = productById.get(pid);
    else if (sSlug && productBySlug.has(sSlug)) p = productBySlug.get(sSlug);

    if (p) {
      const key = String(p._id);
      if (!seen.has(key)) {
        seen.add(key);
        ahmedabadProducts.push(p);
      }
    }
  }

  // Build a slug map preferring location rows
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
    locSeoRows[0] ||
    seos[0] ||
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

  // ---------- JSON-LD blocks ----------
  const baseSeoForLd = firstCardSeo || seos[0] || {};
  const videoLd = parseJsonLd(baseSeoForLd.VideoJsonLd);
  const logoLd = parseJsonLd(baseSeoForLd.LogoJsonLd) ?? buildLogoLdFromParts(baseSeoForLd);
  const breadcrumbLd = buildBreadcrumbLdFromParts(baseSeoForLd);
  const localBusinessLd = buildLocalBusinessLdFromParts(baseSeoForLd);
  const productLd = productJsonLd(baseSeoForLd, firstCard?.name);
  const organizationLd = organizationJsonLd(baseSeoForLd);
  const websiteLd = websiteJsonLd(baseSeoForLd);
  const faqLd = faqJsonLd();

  return (
    <main className="min-h-screen bg-white pb-24 md:pb-0 overflow-x-hidden">
      {/* Structured data */}
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

      {/* HERO */}
      <section className="hero relative bg-white text-slate-900 overflow-hidden pt-4 pb-8 sm:pt-8">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:grid lg:grid-cols-2 gap-8 items-center">
            {/* Left */}
            <div className="space-y-6 sm:space-y-8 w-full mt-4 sm:mt-6 lg:mt-0">
              <h1 className="font-bold leading-tight text-[clamp(1.75rem,4vw,3.75rem)] sm:text-4xl lg:text-6xl text-balance break-words">
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

              <p className="text-base sm:text-xl text-slate-700 max-w-2xl whitespace-pre-wrap break-words">
                {taglineFromSeo ||
                  "Connect with leading fabric suppliers worldwide. Quality textiles, competitive pricing, and reliable supply chains."}
              </p>

              {firstCardSeo && (
                <div className="bg-slate-100 rounded-lg p-4 grid grid-cols-2 gap-4 text-sm">
                  {typeof firstCardSeo.sku !== "undefined" && (
                    <div>
                      <span className="text-slate-700">SKU:</span>
                      <span className="ml-2 text-slate-900 break-words">{firstCardSeo.sku}</span>
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

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <a href="#contact" className="px-6 sm:px-8 py-3 sm:py-4 btn-primary">
                  Get Quote Now
                </a>
                <a href={`tel:${(COMPANY_PHONE ?? "").replace(/\s+/g, "")}`} className="px-6 sm:px-8 py-3 sm:py-4 btn-secondary">
                  📞 Call Now
                </a>
                <a
                  href={process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL}
                  className="px-5 sm:px-6 py-2.5 sm:py-3 border-2 border-emerald-600 text-emerald-700 hover:bg-emerald-700 hover:text-white rounded-lg font-semibold transition-all duration-200"
                >
                  📋 Free Catalog
                </a>
              </div>

              <div className="flex flex-wrap gap-3 sm:gap-4 text-sm text-slate-700 mt-2">
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
            <div className="relative w-full">
              <div className="relative z-10 w-full rounded-2xl overflow-hidden shadow-lg bg-white
                              aspect-[16/10] sm:aspect-[5/4] lg:aspect-[16/9]">
                <Image
                  key={heroImage}
                  src={heroImage}
                  alt={heroAlt}
                  fill
                  priority
                  className="object-center"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 800px"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* COMPANY OVERVIEW (SEO text) */}
      <section className="py-14 sm:py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4 sm:mb-6 text-balance break-words">
              Leading B2B Fabric Supplier Worldwide
            </h2>
            <p className="text-slate-600 mb-6 sm:mb-8">
              ISO 9001 Certified • 500+ Global Partners • Ships to 50+ Countries
            </p>
            <div className="w-24 h-1 bg-gradient-to-r from-blue-600 to-emerald-600 mx-auto" />
          </div>

          <div className="grid lg:grid-cols-2 gap-10 sm:gap-16 items-center">
            <div className="space-y-6">
              <p className="text-base sm:text-lg text-slate-700 leading-relaxed whitespace-pre-wrap break-words">
                {desc1FromSeo ||
                  "As a premier B2B fabric supplier, we specialize in providing high-quality textiles to global garment manufacturers, clothing retailers, and fabric trading companies. Our extensive network spans across major textile hubs worldwide, ensuring consistent supply chains and competitive pricing for bulk fabric orders."}
              </p>

              <p className="text-base sm:text-lg text-slate-700 leading-relaxed whitespace-pre-wrap break-words">
                {desc2FromSeo ||
                  "Our commitment to excellence extends beyond product quality to encompass reliable logistics, flexible payment terms, and comprehensive customer support. Whether you’re sourcing fabrics for fast fashion, luxury apparel, or industrial textiles, our team delivers customized solutions."}
              </p>

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
                key={overviewImage}
                src={overviewImage}
                alt={overviewAlt}
                fill
                loading="lazy"
                className="object-contain object-center"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 600px"
              />
            </div>
          </div>
        </div>
      </section>

      {/* PRODUCTS — ALL Ahmedabad */}
      <section id="products" className="py-14 sm:py-20 bg-white" aria-labelledby="product-categories">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 id="product-categories" className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4 sm:mb-6 text-balance">
              Explore Our Fabric Catalog
            </h2>
            <p className="text-lg sm:text-xl text-slate-600 max-w-3xl mx-auto">
              {taglineFromSeo || "Comprehensive range of premium fabrics for every manufacturing need"}
            </p>
          </div>

          {ahmedabadProducts.length === 0 ? (
            <div className="text-center text-slate-600">
              No products for the selected location.
            </div>
          ) : (
            <div className="grid gap-6 sm:gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
              {ahmedabadProducts.map((p) => {
                const img =
                  (p.img ?? p.image1 ?? p.image2 ?? "/placeholder.svg?height=300&width=400").toString();
                const pid = String(p?._id ?? "").trim();
                const seoSlug = slugByProduct.get(pid) || p?.slug;
                const href = seoSlug ? `/${seoSlug}` : "#";

                const Card = (
                  <div className="relative overflow-hidden rounded-2xl shadow-lg border border-slate-100 hover:border-blue-200 transition">
                    <div className="relative w-full bg-white aspect-[4/3]">
                      <Image
                        src={img}
                        alt={`${p.name} - ${p.productdescription ?? ""}`}
                        fill
                        className="object-contain object-center"
                        loading="lazy"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      />
                    </div>
                    <div className="p-5 sm:p-6">
                      <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2 line-clamp-2 break-words">{p.name}</h3>
                      <p className="text-slate-600 text-sm sm:text-base line-clamp-3 whitespace-pre-wrap break-words">{p.productdescription || "—"}</p>
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

      {/* CONTACT (env-driven) */}
      <section id="contact" className="py-14 sm:py-20 bg-slate-900">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6 text-center text-balance">
            Get Your Custom Quote Today
          </h2>
          <div className="grid lg:grid-cols-2 gap-10 sm:gap-16">
            <ContactForm />
            <div className="space-y-6 text-white break-words">
              <div className="truncate md:whitespace-normal">📞 {COMPANY_PHONE}</div>
              <div className="truncate md:whitespace-normal">✉️ {COMPANY_EMAIL}</div>
              <div className="break-words">🏢 {COMPANY_ADDRESS || "Ahmedabad, Gujarat-380015"}</div>
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
