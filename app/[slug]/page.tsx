// app/[slug]/page.tsx
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { WhatsAppButton } from "@/components/whatsapp-button";
import { Chatbot } from "@/components/chatbot";
import { FAQ } from "@/components/faq";
import { ContactForm } from "@/components/contact-form";
import { fetchSeoData } from "@/lib/seo"; // keep this import; fetchProductData is dynamically imported below
import JsonLdInjector from "@/components/json-ld-injector";
import { CatalogButton } from "@/components/catalog-button";


/* -------------------------------------------------
   API + Auth used for related-products logic
-------------------------------------------------- */
const RAW_BASE = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") ?? "";
const SEO_LIST_URL = RAW_BASE ? `${RAW_BASE}/seo` : "http://localhost:7000/landing/seo";
const PRODUCT_URL = RAW_BASE ? `${RAW_BASE}/product` : "http://localhost:7000/landing/product";

const API_KEY = process.env.NEXT_PUBLIC_API_KEY ?? "";
const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? "";
const API_KEY_HEADER = process.env.NEXT_PUBLIC_API_KEY_HEADER ?? "x-api-key";
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
const isAssetSlug = (slug?: string) => !!slug && slug.includes(".");

function pick<T>(dbVal: T | undefined | null, envVal?: T, fallback?: T) {
  if (dbVal !== undefined && dbVal !== null && String(dbVal).trim() !== "") return dbVal as T;
  if (envVal !== undefined && envVal !== null && String(envVal).trim() !== "") return envVal as T;
  return fallback as T;
}

/** Best-effort splitter for a single-line address env string */
function parseAddressString(addr: string) {
  if (!addr) return {} as any;
  const parts = addr
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
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

/* -------------------------------------------------
   Next.js dynamic flags
-------------------------------------------------- */
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

/**
 * ✅ IMPORTANT: Props typed to match Next 15’s PageProps.
 * Awaiting a non-Promise value is safe (it just returns the value).
 */
type Props = { params: Promise<{ slug: string }> };

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

  // extra fields
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

type ProductDoc = {
  _id: string;
  name?: string;
  slug?: string;
  img?: string;
  image1?: string;
  image2?: string;
  gsm?: string | number;
  oz?: string | number;
  cm?: string | number;
  inch?: string | number;
  salesPrice?: number;
  productdescription?: string;
  sku?: string;
};

/* -------------------------------------------------
   OG/Twitter helpers
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
const VALID_TWITTER_CARDS = new Set(["summary", "summary_large_image", "player", "app"]);

function getLinkedProductId(prod: SeoDocFull["product"]): string {
  if (!prod) return "";
  if (typeof prod === "string") return prod.trim();
  if (typeof prod === "object" && (prod as any)._id) return String((prod as any)._id).trim();
  return "";
}
function ogTypeSafe(v: unknown) {
  const t = String(v ?? "").toLowerCase().trim();
  return (VALID_OG_TYPES.has(t) ? t : "website") as any;
}
function twitterCardSafe(v: unknown): "summary" | "summary_large_image" | "player" | "app" {
  const t = String(v ?? "").toLowerCase().trim();
  return VALID_TWITTER_CARDS.has(t) ? (t as any) : "summary";
}

/* ---------- Meta helpers ---------- */
function buildOtherMeta(seo: SeoDocFull) {
  const other: Record<string, string> = {};
  const set = (name: string, value: any) => {
    const v = asString(value);
    if (v !== undefined && v !== "") other[name] = v;
  };

  // 🚫 Removed (handled elsewhere by Next Metadata or invalid here):
  // - charset, viewport
  // - canonical (use alternates.canonical)
  // - keywords, robots
  // - google-site-verification, msvalidate.01 (use verification)
  // - theme-color, apple-mobile-web-app-*, format-detection
  // - og:* (handled by openGraph)  ❌ also avoids invalid name="og:*"
  // - twitter:* (handled by twitter)
  // - hreflang / x-default (handled by alternates.languages)

  // ✅ Keep only fields that aren't first-class in Metadata and your custom diagnostics:
  set("content-language", seo.contentLanguage);
  set("x-ua-compatible", seo.xUaCompatible); // optional/legacy, but harmless if you want it
  set("author_name", seo.author_name);

  // Custom SEO diagnostics / IDs (safe & unique)
  /* set("seo:product", typeof seo.product === "string" ? seo.product : (seo.product as any)?._id);
  set("seo:location", typeof seo.location === "string" ? seo.location : (seo.location as any)?._id);
  set("seo:locationCode", seo.locationCode);
  set("seo:productIdentifier", seo.productIdentifier);
  set("seo:sku", seo.sku);
  set("seo:slug", seo.slug); */
  set("seo:excerpt", seo.excerpt);
  set("seo:productdescription", seo.productdescription);
  set("seo:description_html", seo.description_html);
 /*  set("seo:popularproduct", asBoolString(seo.popularproduct));
  set("seo:topratedproduct", asBoolString(seo.topratedproduct));
  set("seo:landingPageProduct", asBoolString(seo.landingPageProduct));
  set("seo:shopyProduct", asBoolString(seo.shopyProduct)); */
  set("seo:rating_value", seo.rating_value);
  set("seo:rating_count", seo.rating_count);
  /* set("seo:salesPrice", seo.salesPrice);
  set("seo:purchasePrice", seo.purchasePrice); */

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

function buildLogoLdFromParts(seo: SeoDocFull) {
  if (!seo.LogoJsonLdcontext && !seo.LogoJsonLdtype && !seo.logoJsonLdurl) return null;
  return {
    "@context": seo.LogoJsonLdcontext || "https://schema.org",
    "@type": seo.LogoJsonLdtype || "ImageObject",
    url: nonEmpty(seo.logoJsonLdurl) || COMPANY_LOGO_URL,
    width: nonEmpty(seo.logoJsonLdwidth),
    height: nonEmpty(seo.logoJsonLdheight),
  };
}

/** LocalBusiness JSON-LD — DB → ENV → default */
function buildLocalBusinessLdFromParts(seo: SeoDocFull) {
  const envAddr = parseAddressString(COMPANY_ADDRESS);

  const address = {
    "@type": "PostalAddress",
    streetAddress: pick<string>(
      nonEmpty(seo.LocalBusinessJsonLdaddressstreetAddress),
      envAddr.streetAddress as string,
      "404, Safal Prelude, Corporate Rd, Prahlad Nagar"
    ),
    addressLocality: pick<string>(
      nonEmpty(seo.LocalBusinessJsonLdaddressaddressLocality),
      envAddr.addressLocality as string,
      "Ahmedabad"
    ),
    addressRegion: pick<string>(
      nonEmpty(seo.LocalBusinessJsonLdaddressaddressRegion),
      envAddr.addressRegion as string,
      "Gujarat"
    ),
    postalCode: pick<string>(
      nonEmpty(seo.LocalBusinessJsonLdaddresspostalCode),
      envAddr.postalCode as string,
      "380015"
    ),
    addressCountry: pick<string>(
      nonEmpty(seo.LocalBusinessJsonLdaddressaddressCountry),
      envAddr.addressCountry as string,
      "IN"
    ),
  };

  const lat = parseFloat(seo.LocalBusinessJsonLdgeoLatitude || "");
  const lng = parseFloat(seo.LocalBusinessJsonLdgeoLongitude || "");
  const geo =
    Number.isFinite(lat) && Number.isFinite(lng)
      ? { "@type": "GeoCoordinates", latitude: lat, longitude: lng }
      : undefined;

  const images = [seo.ogImage, seo.twitterImage].filter(Boolean) as string[];
  if (images.length === 0) images.push(COMPANY_LOGO_URL);

  const openingHoursSpecification =
    parseJsonLd(seo.LocalBusinessJsonLdopeningHoursSpecification) ||
    [
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
    name: pick<string>(nonEmpty(seo.LocalBusinessJsonLdname), COMPANY_NAME, COMPANY_NAME),
    url: pick<string>(nonEmpty(seo.canonical_url), COMPANY_SITE_URL, COMPANY_SITE_URL),
    telephone: pick<string>(nonEmpty(seo.LocalBusinessJsonLdtelephone), COMPANY_PHONE, COMPANY_PHONE),
    email: pick<string>(undefined, COMPANY_EMAIL, COMPANY_EMAIL),
    address,
    geo,
    image: images,
    logo: pick<string>(undefined, COMPANY_LOGO_URL, COMPANY_LOGO_URL),
    description: nonEmpty(seo.description),
    areaServed: nonEmpty(seo.LocalBusinessJsonLdareaserved),
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

/** Breadcrumbs */
function buildBreadcrumbLdFromParts(seo: SeoDocFull) {
  let productCategory = "Fabrics";
  if (seo.slug) {
    if (seo.slug.includes("cotton")) productCategory = "Cotton Fabrics";
    else if (seo.slug.includes("silk")) productCategory = "Silk Fabrics";
    else if (seo.slug.includes("wool")) productCategory = "Wool Fabrics";
    else if (seo.slug.includes("polyester")) productCategory = "Polyester Fabrics";
    else if (seo.slug.includes("linen")) productCategory = "Linen Fabrics";
  }
  const itemListElement = [
    { "@type": "ListItem", position: 1, name: "Home", item: COMPANY_SITE_URL || "https://amritafashions.com" },
    { "@type": "ListItem", position: 2, name: "Products", item: (COMPANY_SITE_URL || "https://amritafashions.com") + "/products" },
    {
      "@type": "ListItem",
      position: 3,
      name: productCategory,
      item: `${COMPANY_SITE_URL || "https://amritafashions.com"}/products/${productCategory.toLowerCase().replace(/\s+/g, "-")}`,
    },
    {
      "@type": "ListItem",
      position: 4,
      name: nonEmpty(seo.BreadcrumbJsonLdname) || nonEmpty(seo.title) || "Fabric Details",
      item: nonEmpty(seo.canonical_url) || `${COMPANY_SITE_URL || "https://amritafashions.com"}/${seo.slug}`,
    },
  ];
  return { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement };
}

/** Product JSON-LD */
function productJsonLd(seo: SeoDocFull, productName?: string) {
  const images = [seo.ogImage, seo.twitterImage].filter(Boolean) as string[];
  if (images.length === 0) images.push(COMPANY_LOGO_URL);

  const orgId = (COMPANY_SITE_URL || "https://amritafashions.com") + "/#organization";

  const ld: any = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: productName || nonEmpty(seo.title),
    description: nonEmpty(seo.description),
    sku: nonEmpty(seo.sku) || undefined,
    brand: { "@type": "Brand", name: COMPANY_NAME },
    image: images,
    url: nonEmpty(seo.canonical_url) || COMPANY_SITE_URL || "https://example.com",
    category: "Textile & Fabric",
    manufacturer: { "@type": "Organization", "@id": orgId },
    mpn: nonEmpty(seo.productIdentifier) || undefined,
    gtin: nonEmpty(seo.sku) || undefined,
  };

  if (seo.salesPrice) {
    ld.offers = {
      "@type": "Offer",
      price: seo.salesPrice,
      priceCurrency: "INR",
      availability: "https://schema.org/InStock",
      seller: { "@type": "Organization", "@id": orgId },
      priceValidUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      deliveryLeadTime: { "@type": "QuantitativeValue", value: 7, unitCode: "DAY" },
    };
  }

  if (seo.rating_value && seo.rating_count) {
    ld.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: seo.rating_value,
      reviewCount: seo.rating_count,
      bestRating: 5,
      worstRating: 1,
    };
  }

  if (seo.popularproduct) {
    ld.additionalProperty = { "@type": "PropertyValue", name: "Popular Product", value: "Yes" };
  }

  return ld;
}

/** Organization JSON-LD — DB → ENV → default */
function organizationJsonLd(seo: SeoDocFull) {
  const images = [seo.ogImage, seo.twitterImage].filter(Boolean) as string[];
  if (images.length === 0) images.push(COMPANY_LOGO_URL);

  const envAddr = parseAddressString(COMPANY_ADDRESS);

  const addr = {
    "@type": "PostalAddress",
    streetAddress: pick<string>(
      nonEmpty(seo.OrganizationJsonLdaddressstreetAddress),
      envAddr.streetAddress as string,
      "404, Safal Prelude, Corporate Rd"
    ),
    addressLocality: pick<string>(
      nonEmpty(seo.OrganizationJsonLdaddressaddressLocality),
      envAddr.addressLocality as string,
      "Ahmedabad"
    ),
    addressRegion: pick<string>(
      nonEmpty(seo.OrganizationJsonLdaddressaddressRegion),
      envAddr.addressRegion as string,
      "Gujarat"
    ),
    postalCode: pick<string>(
      nonEmpty(seo.OrganizationJsonLdaddresspostalCode),
      envAddr.postalCode as string,
      "380015"
    ),
    addressCountry: pick<string>(
      nonEmpty(seo.OrganizationJsonLdaddressaddressCountry),
      envAddr.addressCountry as string,
      "IN"
    ),
  };

  const orgUrl = pick<string>(nonEmpty(seo.canonical_url), COMPANY_SITE_URL, "https://example.com");

  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${orgUrl}/#organization`,
    name: pick<string>(nonEmpty(seo.OrganizationJsonLdname), COMPANY_NAME, COMPANY_NAME),
    url: orgUrl,
    logo: {
      "@type": "ImageObject",
      url: pick<string>(nonEmpty(seo.OrganizationJsonLdlogoUrl), COMPANY_LOGO_URL, COMPANY_LOGO_URL),
      width: 131,
      height: 61,
    },
    image: images,
    description:
      nonEmpty(seo.description) ||
      "Leading B2B Fabric Supplier Worldwide - ISO 9001 Certified • 500+ Global Partners • Ships to 50+ Countries",
    address: addr,
    contactPoint: {
      "@type": "ContactPoint",
      telephone: pick<string>(nonEmpty(seo.OrganizationJsonLdtelephone), COMPANY_PHONE, COMPANY_PHONE),
      contactType: "customer service",
      email: pick<string>(nonEmpty(seo.OrganizationJsonLdemail), COMPANY_EMAIL, COMPANY_EMAIL),
      availableLanguage: COMPANY_LANGS,
    },
    sameAs:
      (Array.isArray((seo as any).sameAs) && (seo as any).sameAs.length
        ? (seo as any).sameAs
        : COMPANY_SAME_AS) || undefined,
    ...(COMPANY_FOUNDING_DATE ? { foundingDate: COMPANY_FOUNDING_DATE } : {}),
    ...(COMPANY_EMPLOYEE_RANGE ? { numberOfEmployees: COMPANY_EMPLOYEE_RANGE } : {}),
    ...(COMPANY_AWARDS.length ? { award: COMPANY_AWARDS } : {}),
  };
}

/** Website JSON-LD (env-aware) */
function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${COMPANY_SITE_URL || "https://amritafashions.com"}/#website`,
    name: COMPANY_NAME,
    url: COMPANY_SITE_URL || "https://amritafashions.com",
    description: "Leading B2B Fabric Supplier Worldwide - Premium Quality Textiles",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${COMPANY_SITE_URL || "https://amritafashions.com"}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
    publisher: { "@type": "Organization", "@id": `${COMPANY_SITE_URL || "https://amritafashions.com"}/#organization` },
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

/* ---------- Metadata ---------- */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const seo = await fetchSeoData(slug);
  if (!seo) {
    return {
      title: "Page Not Found",
      description: "The requested page could not be found.",
    };
  }
  const seoFull = seo as SeoDocFull;

  const videoLd = parseJsonLd(seoFull.VideoJsonLd);
  const logoLd = parseJsonLd(seoFull.LogoJsonLd) ?? buildLogoLdFromParts(seoFull);
  const breadcrumbLd = buildBreadcrumbLdFromParts(seoFull);
  const localBusinessLd = buildLocalBusinessLdFromParts(seoFull);
  const productLd = productJsonLd(seoFull, "Pique Knit Fabric");
  const organizationLd = organizationJsonLd(seoFull);
  const websiteLd = websiteJsonLd();
  const faqLd = faqJsonLd();

  return {
    title: seoFull.title,
    description: seoFull.description,
    keywords: seoFull.keywords?.split(",").map((k) => k.trim()).filter(Boolean),
    metadataBase: new URL(seoFull.canonical_url || COMPANY_SITE_URL || "https://example.com"),
    applicationName: seoFull.ogSiteName || COMPANY_NAME,
    authors: seoFull.author_name ? [{ name: seoFull.author_name }] : undefined,
    creator: seoFull.author_name,
    publisher: seoFull.ogSiteName || COMPANY_NAME,
    generator: "Next.js",
    referrer: "origin-when-cross-origin",
    robots: seoFull.robots ? { index: true, follow: true } : undefined,
    viewport: { width: "device-width", initialScale: 1 },
    formatDetection: {
      email: false,
      address: false,
      telephone: seoFull.formatDetection === "telephone=no" ? false : true,
    },
    verification:
      seoFull.googleSiteVerification || seoFull.msValidate
        ? {
            google: seoFull.googleSiteVerification,
            other: seoFull.msValidate ? { "msvalidate.01": seoFull.msValidate } : undefined,
          }
        : undefined,
    themeColor: seoFull.themeColor || "#ffffff",
    appleWebApp: seoFull.mobileWebAppCapable
      ? {
          capable: seoFull.mobileWebAppCapable === "yes",
          statusBarStyle: (seoFull.appleStatusBarStyle as any) || "default",
        }
      : undefined,
    openGraph: {
      url: seoFull.ogUrl || COMPANY_SITE_URL,
      siteName: seoFull.ogSiteName || COMPANY_NAME,
      locale: seoFull.ogLocale,
      title: seoFull.ogTitle,
      description: seoFull.ogDescription,
      type: ogTypeSafe(seoFull.ogType) as any,
      images: seoFull.ogImage ? [seoFull.ogImage] : undefined,
    },
    twitter: {
      card: twitterCardSafe(seoFull.twitterCard) || "summary",
      site: seoFull.twitterSite,
      title: seoFull.twitterTitle,
      description: seoFull.twitterDescription,
      images: seoFull.twitterImage ? [seoFull.twitterImage] : undefined,
    },
    alternates: (() => {
      const canonicalUrl = seoFull.canonical_url
        ? new URL(seoFull.canonical_url).toString()
        : COMPANY_SITE_URL;
      return {
        canonical: canonicalUrl,
        languages: {
          en: canonicalUrl,
        },
      };
    })(),
    other: buildOtherMeta(seoFull),
    // @ts-ignore — carried to component
    jsonLdBlocks: { videoLd, logoLd, breadcrumbLd, localBusinessLd, productLd, organizationLd, websiteLd, faqLd },
  };
}

/* ---------- Page ---------- */
export default async function SlugPage({ params }: Props) {
  const { slug } = await params;
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
  const slugByProduct = new Map<string, string>(); // prefer same-location slug
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

  type ProductDocArr = ProductDoc[];
  const allProducts: ProductDocArr = Array.isArray(productsArr) ? (productsArr as ProductDoc[]) : [];
  const relatedProducts: ProductDoc[] = allProducts.filter((p) => relatedProductIds.has(String(p?._id)));

  // Linked product for hero images
  const linkedProductId = getLinkedProductId(seo.product);
  const matchingProduct: ProductDoc | null = allProducts.find((p) => p._id === linkedProductId) || null;

  // HERO / overview images
  let heroImage = "/placeholder.svg?height=600&width=800";
  let heroAlt = "Premium fabric warehouse with organized textile rolls";
  if (matchingProduct?.img) {
    heroImage = matchingProduct.img;
    heroAlt = matchingProduct.name || heroAlt;
  }
  const overviewImage =
    (matchingProduct?.image2 ||
      matchingProduct?.image1 ||
      matchingProduct?.img ||
      "/placeholder.svg?height=500&width=600") as string;
  const overviewAlt = matchingProduct?.name
    ? `${matchingProduct.name} — secondary view`
    : "Modern textile manufacturing facility";

  // Dynamic copy
  const locationTitle = seo.productlocationtitle?.trim() || "";
  const locationTagline = seo.productlocationtagline?.trim() || "";
  const locationDesc1 = seo.productlocationdescription1?.trim() || "";
  const locationDesc2 = seo.productlocationdescription2?.trim() || "";

  // JSON-LD blocks
  const videoLd = parseJsonLd(seo.VideoJsonLd);
  const logoLd = parseJsonLd(seo.LogoJsonLd) ?? buildLogoLdFromParts(seo);
  const breadcrumbLd = buildBreadcrumbLdFromParts(seo);
  const localBusinessLd = buildLocalBusinessLdFromParts(seo);
  const productLd = productJsonLd(seo, matchingProduct?.name);
  const organizationLd = organizationJsonLd(seo);
  const websiteLd = websiteJsonLd();
  const faqLd = faqJsonLd();

  return (
    <>
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

      <main className="min-h-screen bg-white overflow-x-hidden">
        {/* HERO */}
        <section className="hero relative bg-white text-slate-900 overflow-hidden pt-4 pb-8 sm:pt-10">
          <div className="relative max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
            <div className="flex flex-col lg:grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
              {/* Left Column: Text */}
              <div className="space-y-6 sm:space-y-8 w-full mt-2 lg:mt-0">
                <div className="space-y-4">
                  <h1 className="font-bold leading-tight tracking-tight text-[clamp(1.75rem,4vw,3.75rem)] sm:text-4xl lg:text-6xl break-words">
                    {locationTitle}
                  </h1>
                  <p className="text-base sm:text-lg lg:text-xl text-slate-700 leading-relaxed max-w-2xl whitespace-pre-wrap break-words">
                    {locationTagline}
                  </p>

                  <div className="bg-slate-100 rounded-lg p-4 mt-2 sm:mt-4">
                    <dl className="grid grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
                      <div className="flex items-baseline break-words">
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
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <a href="#contact" className="inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 btn-primary">
                    Get Quote Now
                  </a>
                  <a
                    href={`tel:${COMPANY_PHONE.replace(/\s+/g, "")}`}
                    className="inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 btn-secondary"
                  >
                    📞 Call Now
                  </a>
                 <CatalogButton
                                    product={{
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
                                      inch: matchingProduct?.inch
                                    }}
                                  />
                </div>

                <div className="flex flex-wrap gap-3 sm:gap-4 text-sm text-slate-600 mt-1 sm:mt-2">
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

              {/* Right Column: Image — fully visible & centered */}
              <div className="relative w-full">
                <div className="relative z-10 w-full rounded-2xl overflow-hidden shadow-lg bg-white
                                aspect-[16/10] sm:aspect-[5/4] lg:aspect-[16/9]">
                  <Image
                    src={heroImage}
                    alt={heroAlt}
                    fill
                    priority
                    fetchPriority="high"
                    className="object-contain object-center"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 800px"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* COMPANY OVERVIEW */}
        <section className="py-14 sm:py-20 bg-slate-50">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4 sm:mb-6">
                Leading B2B Fabric Supplier Worldwide
              </h2>
            </div>

            <div className="grid lg:grid-cols-2 gap-10 sm:gap-16 items-center">
              <div className="space-y-6">
                <p className="text-base sm:text-lg text-slate-700 leading-relaxed whitespace-pre-wrap break-words">{locationDesc1}</p>
                <p className="text-base sm:text-lg text-slate-700 leading-relaxed whitespace-pre-wrap break-words">{locationDesc2}</p>

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

              {/* overview image — fully visible & centered */}
              <div className="relative rounded-2xl shadow-lg overflow-hidden bg-white aspect-[4/3] sm:aspect-[5/4] lg:aspect-[3/2] w-full">
                <Image
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

        {/* RELATED PRODUCTS — same-location */}
        <section id="products" className="py-14 sm:py-20 bg-white" aria-labelledby="product-categories">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
            <div className="text-center mb-12 sm:mb-16">
              <h2 id="product-categories" className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4 sm:mb-6">
                Explore Our Fabric Catalog
              </h2>
              <p className="text-lg sm:text-xl text-slate-600 max-w-3xl mx-auto">
                {locationTagline || "Comprehensive range of premium fabrics for every manufacturing need"}
              </p>
            </div>

            {relatedProducts.length === 0 ? (
              <div className="text-center text-slate-600">No products for the selected location.</div>
            ) : (
              <div className="grid gap-6 sm:gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                {relatedProducts.map((p) => {
                  const img = (p.img ?? p.image1 ?? p.image2 ?? "/placeholder.svg?height=300&width=400").toString();
                  const pid = String(p?._id ?? "").trim();
                  const seoSlug = slugByProduct.get(pid) || p.slug;
                  const href = seoSlug ? `/${seoSlug}` : "#";

                  const Card = (
                    <div className="relative overflow-hidden rounded-2xl shadow-lg border border-slate-100 hover:border-blue-200 transition">
                      <div className="relative w-full bg-white aspect-[4/3]">
                        <Image
                          src={img}
                          alt={`${p.name ?? "Fabric"} - ${p.productdescription ?? ""}`}
                          fill
                          className="object-contain object-center"
                          loading="lazy"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        />
                      </div>
                      <div className="p-5 sm:p-6">
                        <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2 break-words">{p.name ?? "Fabric"}</h3>
                        <p className="text-slate-600 text-sm sm:text-base text-wrap whitespace-pre-wrap break-words">{p.productdescription || "—"}</p>
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
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 sm:mb-6">Get Your Custom Quote Today</h2>
              <p className="text-lg sm:text-xl text-slate-300 max-w-3xl mx-auto">
                Connect with our fabric specialists for personalized pricing and bulk order solutions
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-10 sm:gap-16">
              <ContactForm />
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xl">📞</span>
                  </div>
                  <div>
                    <div className="text-white font-semibold">Phone</div>
                    <a
                      href={`tel:${COMPANY_PHONE.replace(/\s+/g, "")}`}
                      className="text-slate-300 hover:text-white transition-colors break-words"
                    >
                      {COMPANY_PHONE}
                    </a>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-emerald-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xl">✉️</span>
                  </div>
                  <div>
                    <div className="text-white font-semibold">Email</div>
                    <a href={`mailto:${COMPANY_EMAIL}`} className="text-slate-300 hover:text-white transition-colors break-words">
                      {COMPANY_EMAIL}
                    </a>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xl">🏢</span>
                  </div>
                  <div>
                    <div className="text-white font-semibold">Office</div>
                    <div className="text-slate-300 break-words">{COMPANY_ADDRESS || "Ahmedabad, Gujarat-380015"}</div>
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