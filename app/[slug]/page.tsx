// app/[slug]/page.tsx
import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { WhatsAppButton } from "@/components/whatsapp-button";
import { Chatbot } from "@/components/chatbot";
import { ProductCategoriesApi } from "@/components/product-categories-api";
import { FAQ } from "@/components/faq";
import { ContactForm } from "@/components/contact-form";
import { fetchSeoData } from "@/lib/seo";
import JsonLdInjector from "@/components/json-ld-injector";

// Ensure fresh SSR for every slug request
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

// In Next.js 15 some dynamic contexts provide `params` as a Promise
type Props = { params: Promise<{ slug: string }> | { slug: string } };

// ---- Full SEO doc type (matches your DB) ----
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

  // added explicitly
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

  // Open Graph media
  ogImage?: string;
  ogVideoUrl?: string;
  ogVideoSecureUrl?: string;
  ogVideoType?: string;
  ogVideoWidth?: number;
  ogVideoHeight?: number;

  // Twitter
  twitterCard?: string;
  twitterSite?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  twitterPlayer?: string;
  twitterPlayerWidth?: number;
  twitterPlayerHeight?: number;

  // JSON-LD (raw strings)
  VideoJsonLd?: string;
  LogoJsonLd?: string;
  LogoJsonLdcontext?: string;
  LogoJsonLdtype?: string;
  logoJsonLdurl?: string;
  logoJsonLdwidth?: string;
  logoJsonLdheight?: string;

  // Breadcrumb JSON-LD
  BreadcrumbJsonLdcontext?: string;
  BreadcrumbJsonLdtype?: string;
  BreadcrumbJsonLdname?: string;
  BreadcrumbJsonLditemListElement?: string;

  // LocalBusiness JSON-LD
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

// Product type
type ProductDoc = {
  _id: string;
  name?: string;
  img?: string;
  image1?: string;
  image2?: string;
};

// Valid OpenGraph types allowed by Next Metadata (note: "product" is NOT allowed)
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

// Valid Twitter card types (Next.js Metadata)
const VALID_TWITTER_CARDS = new Set(["summary", "summary_large_image", "player", "app"]);

// Helpers
const isAssetSlug = (slug?: string) => !!slug && slug.includes(".");
const nonEmpty = (s: any) => (typeof s === "string" && s.trim().length ? s.trim() : undefined);
const asString = (v: any) => (v === undefined || v === null ? undefined : String(v));
const asBoolString = (v: any) => (v === true ? "true" : v === false ? "false" : undefined);

// normalize id whether seoData.product is a string or {_id}
function getLinkedProductId(prod: SeoDocFull["product"]): string {
  if (!prod) return "";
  if (typeof prod === "string") return prod.trim();
  if (typeof prod === "object" && (prod as any)._id) return String((prod as any)._id).trim();
  return "";
}

// Coerce OG type to a value that Next accepts (fallback to "website" if unknown/invalid)
function ogTypeSafe(v: unknown) {
  const t = String(v ?? "").toLowerCase().trim();
  return (VALID_OG_TYPES.has(t) ? t : "website") as any;
}

// Coerce Twitter card to a valid union (undefined if invalid/empty)
function twitterCardSafe(v: unknown) {
  const t = String(v ?? "").toLowerCase().trim();
  return (VALID_TWITTER_CARDS.has(t) ? (t as any) : undefined) as
    | "summary"
    | "summary_large_image"
    | "player"
    | "app"
    | undefined;
}

// ------- Build "other" meta (name=)... for visibility in page source -------
function buildOtherMeta(seo: SeoDocFull) {
  const other: Record<string, string> = {};
  const set = (name: string, value: any) => {
    const v = asString(value);
    if (v !== undefined && v !== "") other[name] = v;
  };

  // Core page meta
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

  // Verification / platform
  set("google-site-verification", seo.googleSiteVerification);
  set("msvalidate.01", seo.msValidate);

  // PWA/device
  set("theme-color", seo.themeColor);
  set("apple-mobile-web-app-capable", seo.mobileWebAppCapable);
  set("apple-mobile-web-app-status-bar-style", seo.appleStatusBarStyle);
  set("format-detection", seo.formatDetection);
  

  // Open Graph (visibility mirror)
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

  // Twitter (visibility mirror)
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

// ---------- JSON-LD helpers ----------
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
    url: nonEmpty(seo.logoJsonLdurl),
    width: nonEmpty(seo.logoJsonLdwidth),
    height: nonEmpty(seo.logoJsonLdheight),
  };
}

// Build LocalBusiness JSON-LD from parts
function buildLocalBusinessLdFromParts(seo: SeoDocFull) {
  const address = {
    "@type": "PostalAddress",
    streetAddress: nonEmpty(seo.LocalBusinessJsonLdaddressstreetAddress) || "404, Safal Prelude, Corporate Rd, Prahlad Nagar",
    addressLocality: nonEmpty(seo.LocalBusinessJsonLdaddressaddressLocality) || "Ahmedabad",
    addressRegion: nonEmpty(seo.LocalBusinessJsonLdaddressaddressRegion) || "Gujarat",
    postalCode: nonEmpty(seo.LocalBusinessJsonLdaddresspostalCode) || "380015",
    addressCountry: nonEmpty(seo.LocalBusinessJsonLdaddressaddressCountry) || "IN"
  };

  const geo = {
    "@type": "GeoCoordinates",
    latitude: parseFloat(seo.LocalBusinessJsonLdgeoLatitude || "23.0225"),
    longitude: parseFloat(seo.LocalBusinessJsonLdgeoLongitude || "72.5714")
  };

  const openingHoursSpecification = [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      opens: "09:30",
      closes: "19:00"
    }
  ];

  const images = [seo.ogImage, seo.twitterImage].filter(Boolean);
  if (images.length === 0) {
    images.push("https://amritafashions.com/wp-content/uploads/amrita-fashions-small-logo-india.webp");
  }

  let review = null;
  if (seo.rating_value && seo.rating_count) {
    review = {
      "@type": "Review",
      reviewRating: {
        "@type": "Rating",
        ratingValue: seo.rating_value,
        bestRating: 5,
        worstRating: 1
      },
      author: {
        "@type": "Person",
        name: "Customer"
      },
      reviewBody: "Excellent quality fabrics and professional service"
    };
  }

  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "parentOrganization": {
      "@type": "Organization",
      "@id": "https://amritafashions.com/#organization"
    },
    name: nonEmpty(seo.LocalBusinessJsonLdname) || "Amrita Fashions",
    url: nonEmpty(seo.canonical_url) || "https://amritafashions.com",
    telephone: nonEmpty(seo.LocalBusinessJsonLdtelephone) || "+919925155141",
    email: "rajesh.goyal@amritafashions.com",
    address,
    geo,
    image: images,
    logo: "https://amritafashions.com/wp-content/uploads/amrita-fashions-small-logo-india.webp",
    description: nonEmpty(seo.description) || "Leading B2B Fabric Supplier Worldwide - ISO 9001 Certified • 500+ Global Partners • Ships to 50+ Countries",
    areaServed: nonEmpty(seo.LocalBusinessJsonLdareaserved) || "Worldwide",
    openingHoursSpecification,
    ...(review && { review }),
    priceRange: "$$",
    paymentAccepted: ["Cash", "Credit Card", "Bank Transfer"],
    currenciesAccepted: ["INR", "USD", "EUR"],
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Fabric Catalog",
      itemListElement: [
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Product",
            name: "Premium Fabrics"
          }
        }
      ]
    }
  };
}

// Build Breadcrumb JSON-LD from parts
function buildBreadcrumbLdFromParts(seo: SeoDocFull) {
  // Determine the product category based on the product type or slug
  let productCategory = "Fabrics";
  if (seo.slug) {
    if (seo.slug.includes('cotton')) productCategory = "Cotton Fabrics";
    else if (seo.slug.includes('silk')) productCategory = "Silk Fabrics";
    else if (seo.slug.includes('wool')) productCategory = "Wool Fabrics";
    else if (seo.slug.includes('polyester')) productCategory = "Polyester Fabrics";
    else if (seo.slug.includes('linen')) productCategory = "Linen Fabrics";
  }

  const itemListElement = [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": "https://amritafashions.com"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Products",
      "item": "https://amritafashions.com/products"
    },
    {
      "@type": "ListItem",
      "position": 3,
      "name": productCategory,
      "item": `https://amritafashions.com/products/${productCategory.toLowerCase().replace(/\s+/g, '-')}`
    },
    {
      "@type": "ListItem",
      "position": 4,
      "name": nonEmpty(seo.BreadcrumbJsonLdname) || nonEmpty(seo.title) || "Fabric Details",
      "item": nonEmpty(seo.canonical_url) || `https://amritafashions.com/${seo.slug}`
    }
  ];

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": itemListElement
  };
}

// Product JSON-LD
function productJsonLd(seo: SeoDocFull, productName?: string) {
  const images = [seo.ogImage, seo.twitterImage].filter(Boolean);
  if (images.length === 0) {
    images.push("https://amritafashions.com/wp-content/uploads/amrita-fashions-small-logo-india.webp");
  }

  const orgId = "https://amritafashions.com/#organization";

  const ld: any = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": productName || nonEmpty(seo.title) || "Premium Fabric",
    "description": nonEmpty(seo.description) || "High-quality fabric for garment manufacturing",
    "sku": nonEmpty(seo.sku) || undefined,
    "brand": {
      "@type": "Brand",
      "name": "Amrita Fashions"
    },
    "image": images,
    "url": nonEmpty(seo.canonical_url) || "https://amritafashions.com",
    "category": "Textile & Fabric",
    "manufacturer": {
      "@type": "Organization",
      "@id": orgId
    },
    "mpn": nonEmpty(seo.productIdentifier) || undefined,
    "gtin": nonEmpty(seo.sku) || undefined
  };

  // Add offers if pricing is available
  if (seo.salesPrice) {
    ld.offers = {
      "@type": "Offer",
      "price": seo.salesPrice,
      "priceCurrency": "INR",
      "availability": "https://schema.org/InStock",
      "seller": {
        "@type": "Organization",
        "@id": orgId
      },
      "priceValidUntil": new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      "deliveryLeadTime": {
        "@type": "QuantitativeValue",
        "value": 7,
        "unitCode": "DAY"
      }
    };
  }

  // Add aggregate rating if available
  if (seo.rating_value && seo.rating_count) {
    ld.aggregateRating = {
      "@type": "AggregateRating",
      "ratingValue": seo.rating_value,
      "reviewCount": seo.rating_count,
      "bestRating": 5,
      "worstRating": 1
    };
  }

  // Add additional product properties
  if (seo.popularproduct) {
    ld.additionalProperty = {
      "@type": "PropertyValue",
      "name": "Popular Product",
      "value": "Yes"
    };
  }

  return ld;
}

// Organization JSON-LD
function organizationJsonLd(seo: SeoDocFull) {
  const images = [seo.ogImage, seo.twitterImage].filter(Boolean);
  if (images.length === 0) {
    images.push("https://amritafashions.com/wp-content/uploads/amrita-fashions-small-logo-india.webp");
  }

  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": "https://amritafashions.com/#organization",
    "name": "Amrita Fashions",
    "url": "https://amritafashions.com",
    "logo": {
      "@type": "ImageObject",
      "url": "https://amritafashions.com/wp-content/uploads/amrita-fashions-small-logo-india.webp",
      "width": 131,
      "height": 61
    },
    "image": images,
    "description": nonEmpty(seo.description) || "Leading B2B Fabric Supplier Worldwide - ISO 9001 Certified • 500+ Global Partners • Ships to 50+ Countries",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "404, Safal Prelude, Corporate Rd, Prahlad Nagar",
      "addressLocality": "Ahmedabad",
      "addressRegion": "Gujarat",
      "postalCode": "380015",
      "addressCountry": "IN"
    },
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+919925155141",
      "contactType": "customer service",
      "email": "rajesh.goyal@amritafashions.com",
      "availableLanguage": ["English", "Hindi", "Gujarati"]
    },
    "sameAs": [
      "https://amritafashions.com"
    ],
    "foundingDate": "2018",
    "numberOfEmployees": "50-100",
    "award": [
      "ISO 9001 Certified",
      "Leading Fabric Manufacturer"
    ]
  };
}

// WebSite JSON-LD
function websiteJsonLd(seo: SeoDocFull) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": "https://amritafashions.com/#website",
    "name": "Amrita Fashions",
    "url": "https://amritafashions.com",
    "description": "Leading B2B Fabric Supplier Worldwide - Premium Quality Textiles",
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": "https://amritafashions.com/search?q={search_term_string}"
      },
      "query-input": "required name=search_term_string"
    },
    "publisher": {
      "@type": "Organization",
      "@id": "https://amritafashions.com/#organization"
    }
  };
}

// FAQ JSON-LD
function faqJsonLd() {
  const faqs = [
    {
      question: "What is your minimum order quantity for bulk fabric orders?",
      answer: "Our minimum order quantity varies by fabric type, typically starting from 500 meters for standard fabrics and 1000 meters for custom specifications. We work with garment manufacturers and retailers of all sizes to accommodate their specific needs."
    },
    {
      question: "Do you provide fabric samples before placing bulk orders?",
      answer: "Yes, we provide free fabric samples for all our products. Sample orders are processed within 3-5 business days and shipped worldwide. This allows fabric importers and manufacturers to evaluate quality before committing to larger orders."
    },
    {
      question: "What are your payment terms for B2B fabric orders?",
      answer: "We offer flexible payment terms including T/T (Telegraphic Transfer), L/C (Letter of Credit), and for established clients, we provide 30-60 day payment terms. All transactions are secure and comply with international trade regulations."
    },
    {
      question: "How do you ensure consistent quality across large fabric orders?",
      answer: "We maintain strict quality control processes including pre-production samples, in-line inspection during manufacturing, and final quality checks before shipment. All our facilities are ISO certified and follow international quality standards."
    },
    {
      question: "What is your typical lead time for fabric manufacturing and delivery?",
      answer: "Lead times vary based on fabric type and order quantity. Standard fabrics: 15-20 days, custom fabrics: 25-35 days. We provide detailed production schedules and regular updates throughout the manufacturing process."
    },
    {
      question: "Do you offer custom fabric development services?",
      answer: "Yes, we specialize in custom fabric development for clothing brands and manufacturers. Our R&D team works closely with clients to develop unique fabric compositions, colors, and finishes that meet specific requirements."
    }
  ];

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };
}

// ---------- Metadata ----------
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  console.log("🔍 Fetching SEO data for slug:", slug);

  const seo = await fetchSeoData(slug);
  if (!seo) {
    return {
      title: "Page Not Found",
      description: "The requested page could not be found.",
    };
  }
  
  // Cast to SeoDocFull to access all properties
  const seoFull = seo as SeoDocFull;

  // JSON-LD blocks — prefer raw JSON strings; otherwise build from parts
  const videoLd = parseJsonLd(seo.VideoJsonLd);
  const logoLd = parseJsonLd(seo.LogoJsonLd) ?? buildLogoLdFromParts(seo);
  const breadcrumbLd = buildBreadcrumbLdFromParts(seo);
  const localBusinessLd = buildLocalBusinessLdFromParts(seo);
  const productLd = productJsonLd(seo, "Pique Knit Fabric");
  const organizationLd = organizationJsonLd(seo);
  const websiteLd = websiteJsonLd(seo);
  const faqLd = faqJsonLd();

  // Create JSON-LD scripts for head injection
  const jsonLdScripts = [
    videoLd && { type: "application/ld+json", content: JSON.stringify(videoLd) },
    logoLd && { type: "application/ld+json", content: JSON.stringify(logoLd) },
    breadcrumbLd && { type: "application/ld+json", content: JSON.stringify(breadcrumbLd) },
    localBusinessLd && { type: "application/ld+json", content: JSON.stringify(localBusinessLd) },
    { type: "application/ld+json", content: JSON.stringify(productLd) },
    { type: "application/ld+json", content: JSON.stringify(organizationLd) },
    { type: "application/ld+json", content: JSON.stringify(websiteLd) },
    { type: "application/ld+json", content: JSON.stringify(faqLd) }
  ].filter(Boolean);

  // Build metadata object with proper typing
  const metadata: Metadata = {
    title: seoFull.title || "Premium Fabric",
    description: seoFull.description || "High-quality fabric for garment manufacturing.",
    keywords: seoFull.keywords?.split(',').map(k => k.trim()).filter(Boolean) || ["fabric", "textile", "garment", "wholesale", "manufacturer"],
    metadataBase: new URL(seoFull.canonical_url || "https://example.com"),
    applicationName: seoFull.ogSiteName || "Amrita Fashions",
    authors: seoFull.author_name ? [{ name: seoFull.author_name }] : undefined,
    creator: seoFull.author_name,
    publisher: seoFull.ogSiteName,
    generator: "Next.js",
    referrer: "origin-when-cross-origin",
    robots: seoFull.robots ? { index: true, follow: true } : undefined,
    viewport: { width: 'device-width', initialScale: 1 },
    formatDetection: {
      email: false,
      address: false,
      telephone: seoFull.formatDetection === "telephone=no" ? false : true,
    },
    verification: seoFull.googleSiteVerification || seoFull.msValidate ? {
      google: seoFull.googleSiteVerification,
      other: seoFull.msValidate ? { "msvalidate.01": seoFull.msValidate } : undefined,
    } : undefined,
    themeColor: seoFull.themeColor || "#ffffff",
    appleWebApp: seoFull.mobileWebAppCapable ? {
      capable: seoFull.mobileWebAppCapable === "yes",
      statusBarStyle: (seoFull.appleStatusBarStyle as any) || "default",
    } : undefined,
    openGraph: {
      url: seoFull.ogUrl || "https://example.com/premium-cotton-ic",
      siteName: seoFull.ogSiteName || "AGE Fabric hop",
      locale: seoFull.ogLocale || "en_US",
      title: seoFull.ogTitle || "Premium Cotton Fac",
      description: seoFull.ogDescription || "High-quality fabric for B2B customers.",
      type: ogTypeSafe(seoFull.ogType) as any, // Cast to any to handle custom types
      images: seoFull.ogImage ? [
        {
          url: seoFull.ogImage,
          width: 1200,
          height: 630,
          alt: seoFull.ogTitle || "Premium Cotton Fabric",
        }
      ] : [],
      videos: seoFull.ogVideoUrl ? [
        {
          url: seoFull.ogVideoUrl,
          secureUrl: seoFull.ogVideoSecureUrl,
          type: seoFull.ogVideoType as any,
          width: seoFull.ogVideoWidth,
          height: seoFull.ogVideoHeight,
        }
      ] : [],
    },
    twitter: {
      card: twitterCardSafe(seoFull.twitterCard) || 'summary_large_image',
      site: seoFull.twitterSite || "@ageb",
      title: seoFull.twitterTitle || "Premium",
      description: seoFull.twitterDescription || "High-quality cotton wholesale prices.",
      images: seoFull.twitterImage ? [{ url: seoFull.twitterImage }] : [],
    },
    alternates: (() => {
      const canonicalUrl = seoFull.canonical_url ? new URL(seoFull.canonical_url).toString() : "https://example.com/premium-cotton-fabric";
      return {
        canonical: canonicalUrl,
        languages: {
          "en": canonicalUrl,
          "x-default": seoFull.x_default || "https://example.com",
        },
      };
    })(),
    other: buildOtherMeta(seo),
  };
  
  return metadata;
}

export default async function SlugPage({ params }: Props) {
  const resolved = "then" in (params as any) ? await (params as Promise<{ slug: string }>) : (params as { slug: string });
  const { slug } = resolved;
  if (isAssetSlug(slug)) return null;

  const [{ fetchProductData }] = await Promise.all([import("@/lib/seo")]);
  const [rawSeo, products] = await Promise.all([fetchSeoData(slug), fetchProductData()]);

  if (!rawSeo) notFound();
  const seo = rawSeo as SeoDocFull;

  // Linked product
  const linkedProductId = getLinkedProductId(seo.product);
  const matchingProduct: ProductDoc | null =
    (Array.isArray(products) ? (products as ProductDoc[]).find((p) => p._id === linkedProductId) : null) || null;

  // HERO / overview images
  let heroImage = "/placeholder.svg?height=600&width=800";
  let heroAlt = "Premium fabric warehouse with organized textile rolls";
  if (matchingProduct?.img) {
    heroImage = matchingProduct.img;
    heroAlt = matchingProduct.name || heroAlt;
  }
  const overviewImage =
    matchingProduct?.image2?.trim() ||
    matchingProduct?.image1?.trim() ||
    matchingProduct?.img?.trim() ||
    "/placeholder.svg?height=500&width=600";
  const overviewAlt =
    matchingProduct?.name ? `${matchingProduct.name} — secondary view` : "Modern textile manufacturing facility";

  // Dynamic copy
  const locationTitle = seo.productlocationtitle?.trim() || "";
  const locationTagline = seo.productlocationtagline?.trim() || "";
  const locationDesc1 = seo.productlocationdescription1?.trim() || "";
  const locationDesc2 = seo.productlocationdescription2?.trim() || "";

  // JSON-LD blocks — prefer raw JSON strings; otherwise build from parts
  const videoLd = parseJsonLd(seo.VideoJsonLd);
  const logoLd = parseJsonLd(seo.LogoJsonLd) ?? buildLogoLdFromParts(seo);
  const breadcrumbLd = buildBreadcrumbLdFromParts(seo);
  const localBusinessLd = buildLocalBusinessLdFromParts(seo);
  const productLd = productJsonLd(seo, matchingProduct?.name);
  const organizationLd = organizationJsonLd(seo);
  const websiteLd = websiteJsonLd(seo);
  const faqLd = faqJsonLd();

  return (
    <>
      {/* JSON-LD Structured Data - Injected into head via Next.js Script */}
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

                  <p className="text-base sm:text-xl text-slate-600 leading-relaxed max-w-2xl">{locationTagline}</p>

   <div className="bg-slate-100 rounded-lg p-4 mt-4">
  <dl className="grid grid-cols-2 gap-4 text-sm">
    <div className="flex items-baseline">
      <dt className="text-slate-800 font-medium">SKU:</dt>
      <dd className="ml-2 text-slate-950">{seo.sku ?? "—"}</dd>
    </div>

    <div className="flex items-baseline">
      <dt className="text-slate-800 font-medium">Price:</dt>
      <dd className="ml-2 text-slate-950">${seo.salesPrice}</dd>
    </div>

    <div className="flex items-baseline">
      <dt className="text-slate-800 font-medium">Rating:</dt>
      <dd className="ml-2 text-slate-950">{seo.rating_value}/5</dd>
    </div>

    <div className="flex items-baseline">
      <dt className="text-slate-800 font-medium">Reviews:</dt>
      <dd className="ml-2 text-slate-950">{seo.rating_count}</dd>
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
  href="https://n8n.egport.com/webhook-test/a59f3482-d830-4d83-ae0e-3e5a955350a9"
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

        {/* TRUSTED BY */}
        <section className="py-16 bg-white border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Trusted by Leading Brands Worldwide</h2>
              <p className="text-slate-600">Ships to 50+ countries • MOQ 100 meters • 24-hour response time</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center">
  <div className="bg-slate-100 h-16 rounded-lg flex items-center justify-center">
    <span className="text-slate-800 font-semibold">ACME APPAREL</span>
  </div>
  <div className="bg-slate-100 h-16 rounded-lg flex items-center justify-center">
    <span className="text-slate-800 font-semibold">FASHION CORP</span>
  </div>
  <div className="bg-slate-100 h-16 rounded-lg flex items-center justify-center">
    <span className="text-slate-800 font-semibold">TEXTILE PLUS</span>
  </div>
  <div className="bg-slate-100 h-16 rounded-lg flex items-center justify-center">
    <span className="text-slate-800 font-semibold">GLOBAL WEAR</span>
  </div>
</div>

            {/* Case Study */}
            <div className="mt-16 bg-gradient-to-r from-blue-50 to-emerald-50 p-8 rounded-2xl border border-blue-100">
              <div className="max-w-4xl mx-auto">
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Success Story</h3>
                  <p className="text-slate-600">How Acme Apparel reduced lead times by 30% with our fabrics</p>
                </div>

                <div className="grid md:grid-cols-3 gap-6 text-center">
                  <div className="bg-white p-6 rounded-xl shadow-sm">
                    <div className="text-3xl font-bold text-blue-600 mb-2">30%</div>
                    <div className="text-sm text-slate-600">Faster Lead Times</div>
                  </div>
                  <div className="bg-white p-6 rounded-xl shadow-sm">
                    <div className="text-3xl font-bold text-emerald-600 mb-2">15%</div>
                    <div className="text-sm text-slate-600">Cost Reduction</div>
                  </div>
                  <div className="bg-white p-6 rounded-xl shadow-sm">
                    <div className="text-3xl font-bold text-purple-600 mb-2">99.8%</div>
                    <div className="text-sm text-slate-600">Quality Rate</div>
                  </div>
                </div>

                <div className="text-center mt-6">
                  <a href="#case-study" className="text-blue-600 hover:text-blue-700 font-medium">
                    Read Full Case Study →
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* PRODUCT CATEGORIES */}
        <ProductCategoriesApi />

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
                    <a
                      href="mailto: rajesh.goyal@amritafashions.com"
                      className="text-slate-300 hover:text-white transition-colors"
                    >
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
                      <br />
                      Ahmedabad, Gujarat-380015
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

              {/* Floating actions */}
      <WhatsAppButton />
      <Chatbot />
    </main>
  </>
);
}
