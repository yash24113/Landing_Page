// // src/lib/seo.ts
// // Build API URLs exactly like page.tsx does
// const RAW_BASE =
//   process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") ?? ""; // e.g. http://localhost:7000/landing
// const SEO_URL = RAW_BASE ? `${RAW_BASE}/seo` : "";
// const PRODUCT_URL = RAW_BASE ? `${RAW_BASE}/product` : "";

// // Build auth headers exactly like page.tsx
// const API_KEY = process.env.API_KEY || process.env.NEXT_PUBLIC_API_KEY || "";
// const ADMIN_EMAIL = process.env.ADMIN_EMAIL || process.env.NEXT_PUBLIC_ADMIN_EMAIL || "";
// const API_KEY_HEADER = process.env.API_KEY_HEADER || process.env.NEXT_API_KEY_HEADER || "x-api-key";
// const ADMIN_EMAIL_HEADER =
//   process.env.ADMIN_EMAIL_HEADER || process.env.NEXT_PUBLIC_ADMIN_EMAIL_HEADER || "x-admin-email";

// const authHeaders: Record<string, string> = {};
// if (API_KEY) authHeaders[API_KEY_HEADER] = API_KEY;
// if (ADMIN_EMAIL) authHeaders[ADMIN_EMAIL_HEADER] = ADMIN_EMAIL;

// /* ------------ Types ------------ */
// export interface SeoData {
//   openGraph?: {
//     video?: {
//       url?: string;
//       secure_url?: string;
//       type?: string;
//       width?: number | null;
//       height?: number | null;
//     };
//     images?: any[];
//   };
//   twitter?: {
//     image?: string;
//     player?: string;
//     player_width?: number;
//     player_height?: number;
//   };
//   _id: string;
//   product: string | { _id?: string };
//   location: string | { _id?: string };
//   popularproduct?: boolean;
//   topratedproduct?: boolean;
//   slug: string;
//   createdAt?: string;
//   updatedAt?: string;
//   BreadcrumbJsonLd?: string;
//   LocalBusinessJsonLd?: string;
//   LogoJsonLd?: string;
//   VideoJsonLd?: string;
//   appleStatusBarStyle?: string;
//   author_name?: string;
//   canonical_url?: string;
//   charset?: string;
//   contentLanguage?: string;
//   description?: string;
//   description_html?: string;
//   excerpt?: string;
//   formatDetection?: string;
//   hreflang?: string;
//   keywords?: string;
//   locationCode?: string;
//   mobileWebAppCapable?: string;
//   msValidate?: string;
//   ogDescription?: string;
//   ogLocale?: string;
//   ogSiteName?: string;
//   ogTitle?: string;
//   ogType?: string;
//   ogUrl?: string;
//   productIdentifier?: string;
//   productdescription?: string;
//   purchasePrice?: number;
//   rating_count?: number;
//   rating_value?: number;
//   robots?: string;
//   salesPrice?: number;
//   sku?: string;
//   themeColor?: string;
//   title?: string;
//   twitterCard?: string;
//   twitterDescription?: string;
//   twitterSite?: string;
//   twitterTitle?: string;
//   viewport?: string;
//   xUaCompatible?: string;
//   x_default?: string;
// }

// export interface ProductData {
//   _id: string;
//   name: string;
//   img?: string;
//   image1?: string;
//   image2?: string;
//   video?: string;
//   videoThumbnail?: string;
//   color?: any[];
//   slug?: string;
//   createdAt?: string;
//   updatedAt?: string;
// }

// interface ApiResponse<T> {
//   success?: boolean;
//   data?: T;
//   total?: number;
//   message?: string;
// }

// /** Fetch SEO list, then pick the one with the matching slug. */
// export async function fetchSeoData(slug: string): Promise<SeoData | null> {
//   if (!SEO_URL) return null;

//   try {
//     const res = await fetch(SEO_URL, {
//       method: "GET",
//       headers: { ...authHeaders, "Content-Type": "application/json" },
//       cache: "no-store",
//       // AbortSignal.timeout is fine on Node runtime; if you’re on edge remove it.
//       // @ts-ignore
//       signal: typeof AbortSignal !== "undefined" && AbortSignal.timeout ? AbortSignal.timeout(10000) : undefined,
//     });

//     if (!res.ok) {
//       console.error("fetchSeoData: HTTP", res.status, res.statusText);
//       return null;
//     }

//     const json: ApiResponse<SeoData[]> = await res.json();
//     const list = Array.isArray(json?.data) ? json.data : [];
//     return list.find((x) => x.slug === slug) ?? null;
//   } catch (e) {
//     console.error("fetchSeoData error:", e);
//     return null;
//   }
// }

// /** Fetch product list. */
// export async function fetchProductData(): Promise<ProductData[]> {
//   if (!PRODUCT_URL) return [];

//   try {
//     const res = await fetch(PRODUCT_URL, {
//       method: "GET",
//       headers: { ...authHeaders, "Content-Type": "application/json" },
//       cache: "no-store",
//       // @ts-ignore
//       signal: typeof AbortSignal !== "undefined" && AbortSignal.timeout ? AbortSignal.timeout(10000) : undefined,
//     });

//     if (!res.ok) {
//       console.error("fetchProductData: HTTP", res.status, res.statusText);
//       return [];
//     }

//     const json: ApiResponse<ProductData[]> = await res.json();
//     return Array.isArray(json?.data) ? json.data : [];
//   } catch (e) {
//     console.error("fetchProductData error:", e);
//     return [];
//   }
// }

// /** Convenience: get product name for a given SEO slug. */
// export async function getProductNameForSlug(slug: string): Promise<string | null> {
//   const [seo, products] = await Promise.all([fetchSeoData(slug), fetchProductData()]);
//   if (!seo || !products.length) return null;

//   const pid = typeof seo.product === "string" ? seo.product : (seo.product?._id || "");
//   const match = products.find((p) => p._id === pid);
//   return match?.name ?? null;
// }
// src/lib/seo.ts

/* -------------------------------------------------
   Base URLs (mirror page.tsx)
-------------------------------------------------- */
const RAW_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") ?? ""; // e.g. http://localhost:7000/landing
const SEO_URL = RAW_BASE ? `${RAW_BASE}/seo` : "";
const PRODUCT_URL = RAW_BASE ? `${RAW_BASE}/product` : "";

/* -------------------------------------------------
   Auth headers (mirror page.tsx)
-------------------------------------------------- */
const API_KEY = process.env.API_KEY || process.env.NEXT_PUBLIC_API_KEY || "";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || process.env.NEXT_PUBLIC_ADMIN_EMAIL || "";
const API_KEY_HEADER = process.env.API_KEY_HEADER || process.env.NEXT_API_KEY_HEADER || "x-api-key";
const ADMIN_EMAIL_HEADER =
  process.env.ADMIN_EMAIL_HEADER || process.env.NEXT_PUBLIC_ADMIN_EMAIL_HEADER || "x-admin-email";

const authHeaders: Record<string, string> = {};
if (API_KEY) authHeaders[API_KEY_HEADER] = API_KEY;
if (ADMIN_EMAIL) authHeaders[ADMIN_EMAIL_HEADER] = ADMIN_EMAIL;

/* -------------------------------------------------
   ISR window (App Router equivalent of getStaticProps revalidate)
-------------------------------------------------- */
export const REVALIDATE_SECS = 7776000; // 90 days

/* ------------ Types ------------ */
export interface SeoData {
  openGraph?: {
    video?: {
      url?: string;
      secure_url?: string;
      type?: string;
      width?: number | null;
      height?: number | null;
    };
    images?: any[];
  };
  twitter?: {
    image?: string;
    player?: string;
    player_width?: number;
    player_height?: number;
  };
  _id: string;
  product: string | { _id?: string };
  location: string | { _id?: string };
  popularproduct?: boolean;
  topratedproduct?: boolean;
  slug: string;
  createdAt?: string;
  updatedAt?: string;
  BreadcrumbJsonLd?: string;
  LocalBusinessJsonLd?: string;
  LogoJsonLd?: string;
  VideoJsonLd?: string;
  appleStatusBarStyle?: string;
  author_name?: string;
  canonical_url?: string;
  charset?: string;
  contentLanguage?: string;
  description?: string;
  description_html?: string;
  excerpt?: string;
  formatDetection?: string;
  hreflang?: string;
  keywords?: string;
  locationCode?: string;
  mobileWebAppCapable?: string;
  msValidate?: string;
  ogDescription?: string;
  ogLocale?: string;
  ogSiteName?: string;
  ogTitle?: string;
  ogType?: string;
  ogUrl?: string;
  productIdentifier?: string;
  productdescription?: string;
  purchasePrice?: number;
  rating_count?: number;
  rating_value?: number;
  robots?: string;
  salesPrice?: number;
  sku?: string;
  themeColor?: string;
  title?: string;
  twitterCard?: string;
  twitterDescription?: string;
  twitterSite?: string;
  twitterTitle?: string;
  viewport?: string;
  xUaCompatible?: string;
  x_default?: string;
}

export interface ProductData {
  _id: string;
  name: string;
  img?: string;
  image1?: string;
  image2?: string;
  video?: string;
  videoThumbnail?: string;
  color?: any[];
  slug?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface ApiResponse<T> {
  success?: boolean;
  data?: T;
  total?: number;
  message?: string;
}

/* -------------------------------------------------
   Helpers
-------------------------------------------------- */
const fetchOpts = {
  // App Router ISR hint (equivalent to getStaticProps revalidate)
  next: { revalidate: REVALIDATE_SECS },
  headers: { ...authHeaders, "Content-Type": "application/json" },
  // AbortSignal.timeout is fine on Node runtime; remove if running on edge.
  // @ts-ignore
  signal: typeof AbortSignal !== "undefined" && AbortSignal.timeout ? AbortSignal.timeout(10000) : undefined,
} as const;

/** Fetch SEO list, then pick the one with the matching slug. */
export async function fetchSeoData(slug: string): Promise<SeoData | null> {
  if (!SEO_URL) return null;

  try {
    const res = await fetch(SEO_URL, { ...fetchOpts, method: "GET" });

    if (!res.ok) {
      console.error("fetchSeoData: HTTP", res.status, res.statusText);
      return null;
    }

    const json: ApiResponse<SeoData[]> = await res.json();
    const list = Array.isArray(json?.data) ? json.data : [];
    return list.find((x) => x.slug === slug) ?? null;
  } catch (e) {
    console.error("fetchSeoData error:", e);
    return null;
  }
}

/** Fetch product list. */
export async function fetchProductData(): Promise<ProductData[]> {
  if (!PRODUCT_URL) return [];

  try {
    const res = await fetch(PRODUCT_URL, { ...fetchOpts, method: "GET" });

    if (!res.ok) {
      console.error("fetchProductData: HTTP", res.status, res.statusText);
      return [];
    }

    const json: ApiResponse<ProductData[]> = await res.json();
    return Array.isArray(json?.data) ? json.data : [];
  } catch (e) {
    console.error("fetchProductData error:", e);
    return [];
  }
}

/** Convenience: get product name for a given SEO slug. */
export async function getProductNameForSlug(slug: string): Promise<string | null> {
  const [seo, products] = await Promise.all([fetchSeoData(slug), fetchProductData()]);
  if (!seo || !products.length) return null;

  const pid = typeof seo.product === "string" ? seo.product : (seo.product?._id || "");
  const match = products.find((p) => p._id === pid);
  return match?.name ?? null;
}
