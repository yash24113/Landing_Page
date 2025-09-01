// app/page.tsx
import type { Metadata } from "next";
import Image from "next/image";
import { WhatsAppButton } from "@/components/whatsapp-button";
import { Chatbot } from "@/components/chatbot";
import { ProductCategoriesApi } from "@/components/product-categories-api";
import { FAQ } from "@/components/faq";
import { ContactForm } from "@/components/contact-form";

/* -------------------------------------------------
   API URLs
-------------------------------------------------- */
const RAW_BASE = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") ?? "";
const SEO_URL = RAW_BASE
  ? `${RAW_BASE}/seo/landing-page`
  : "http://localhost:7000/landing/seo/landing-page";
const PRODUCT_URL = RAW_BASE
  ? `${RAW_BASE}/product`
  : "http://localhost:7000/landing/product";
const LOC_URL = RAW_BASE
  ? `${RAW_BASE}/locations`
  : "http://localhost:7000/landing/locations";

/** Contact endpoint (override with NEXT_PUBLIC_CONTACT_URL if needed) */
const CONTACT_URL =
  process.env.NEXT_PUBLIC_CONTACT_URL ??
  (RAW_BASE ? `${RAW_BASE}/contacts` : "http://localhost:7000/landing/contacts");

/* -------------------------------------------------
   AUTH HEADERS (must match your backend if required)
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

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, { cache: "no-store", headers: authHeaders });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

/** first non-empty string that looks like a URL or root path */
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

/** choose a valid image that is NOT the same as `notEq` */
function pickImageNotEq(
  notEq: string,
  ...candidates: Array<string | undefined | null>
): string {
  for (const c of candidates) {
    const s = (c ?? "").toString().trim();
    if (!s) continue;
    if ((s.startsWith("/") || s.startsWith("http://") || s.startsWith("https://")) && s !== notEq) {
      return s;
    }
  }
  return "/placeholder.svg?height=500&width=600";
}

/* -------------------------------------------------
   Metadata guards for OG/Twitter
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

function coerceOgType(v: unknown) {
  const t = String(v ?? "").toLowerCase().trim();
  return (VALID_OG_TYPES.has(t) ? t : "website") as any;
}
function coerceTwitterCard(v: unknown) {
  const t = String(v ?? "").toLowerCase().trim();
  return (VALID_TWITTER_CARDS.has(t) ? t : "summary_large_image") as any;
}

/* -------------------------------------------------
   Server Actions
   - saveContactDraft: create/update partial record on step changes
   - submitContact: final submit (creates or updates existing draft)
-------------------------------------------------- */
export async function saveContactDraft(fd: FormData) {
  "use server";

  const draftId = (fd.get("draftId") ?? "").toString().trim();

  const body: any = {
    companyName: (fd.get("companyName") ?? "").toString(),
    contactPerson: (fd.get("contactPerson") ?? "").toString(),
    email: (fd.get("email") ?? "").toString(),
    phoneNumber: (fd.get("phoneNumber") ?? "").toString(), // mapping from client "phone"
    businessType: (fd.get("businessType") ?? "").toString(),
    annualFabricVolume: (fd.get("annualFabricVolume") ?? "").toString(), // mapping from "annualVolume"
    primaryMarkets: (fd.get("primaryMarkets") ?? "").toString(),
    specificationsRequirements: (fd.get("specificationsRequirements") ?? "").toString(), // mapping from "specifications"
    timeline: (fd.get("timeline") ?? "").toString(),
    additionalMessage: (fd.get("additionalMessage") ?? "").toString(), // mapping from "message"
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

  // the client passes our backend field names already
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

  const ftoi = formData
    .getAll("fabricTypesOfInterest")
    .map((v) => v.toString().trim())
    .filter(Boolean);
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

/* -------------------------------------------------
   Metadata
-------------------------------------------------- */
export async function generateMetadata(): Promise<Metadata> {
  const seoJson = await fetchJson<any>(SEO_URL);
  const locJson = await fetchJson<any>(LOC_URL);

  const seos: any[] = Array.isArray(seoJson?.data) ? seoJson.data : [];
  const locs: any[] = Array.isArray(locJson?.data?.locations)
    ? locJson.data.locations
    : [];

  // default location: "ahmedabad"
  const defaultLoc =
    locs.find((l) => String(l?.name ?? "").toLowerCase() === "ahmedabad") || null;
  const defaultLocId = defaultLoc?._id ?? "";

  // pick SEO row for that location (or first available)
  const seoData =
    seos.find((s) => toId(s.location) === defaultLocId) || seos[0] || null;

  if (!seoData) return {};

  // coerce card to valid union if possible, otherwise leave undefined
  const twRaw = String(seoData.twitterCard ?? "").trim().toLowerCase();
  const twitterCard =
    twRaw === "summary" ||
    twRaw === "summary_large_image" ||
    twRaw === "player" ||
    twRaw === "app"
      ? (twRaw as "summary" | "summary_large_image" | "player" | "app")
      : undefined;

  const ogImages = seoData.ogImage ? [seoData.ogImage] : undefined;
  const twitterImages = seoData.twitterImage ? [seoData.twitterImage] : undefined;

  return {
    title: seoData.title,
    description: seoData.description,
    keywords: seoData.keywords,
    openGraph: {
      title: seoData.ogTitle,
      description: seoData.ogDescription,
      siteName: seoData.ogSiteName,
      locale: seoData.ogLocale,
      type: (String(seoData.ogType ?? "").trim() || "website") as any,
      url: seoData.ogUrl,
      images: ogImages,
    } as any,
    twitter: {
      card: twitterCard,
      // EXACTLY from DB — no fallbacks or transformations
      title: seoData.twitterTitle,
      description: seoData.twitterDescription,
      site: seoData.twitterSite,
      images: twitterImages,
    },
    alternates: { canonical: seoData.canonical_url },
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
  const locs: any[] = Array.isArray(locJson?.data?.locations)
    ? locJson.data.locations
    : [];

  // ----- Default location = ahmedabad
  const defaultLoc =
    locs.find((l) => String(l?.name ?? "").toLowerCase() === "ahmedabad") ||
    null;
  const defaultLocId = defaultLoc?._id ?? "";

  /* -----------------------------------------------------------
     Build the exact product list your catalog shows on home:
     - product ids from SEO by default location
     - keep original product order
  ----------------------------------------------------------- */
  const locProductIdSet = new Set<string>(
    seos
      .filter((s) => toId(s.location) === defaultLocId)
      .map((s) => toId(s.product))
      .filter(Boolean)
  );

  const anySeoProductIdSet =
    locProductIdSet.size > 0
      ? locProductIdSet
      : new Set<string>(seos.map((s) => toId(s.product)).filter(Boolean));

  const catalogOrdered = products.filter((p) =>
    anySeoProductIdSet.has((p?._id ?? "").trim())
  );

  // FIRST CARD (with any image)
  const firstCard =
    catalogOrdered.find(
      (p) =>
        (p?.image1 ?? p?.image2 ?? p?.img ?? "").toString().trim().length > 0
    ) || catalogOrdered[0] || null;

  // Optional: pull basic SEO row for that card (price, etc.)
  const firstCardSeo =
    seos.find(
      (s) =>
        toId(s.product) === (firstCard?._id ?? "") &&
        (toId(s.location) === defaultLocId || defaultLocId === "")
    ) ||
    seos.find((s) => toId(s.product) === (firstCard?._id ?? "")) ||
    null;

  /* -----------------------------------------------------------
     HERO & OVERVIEW images:
     - HERO prefers `img` (primary), then `image1`, then `image2`
     - OVERVIEW prefers `image2`, then `image1`, then `img`
     - OVERVIEW avoids duplicating the HERO image when possible
  ----------------------------------------------------------- */
  const heroImage = pickImage(
    firstCard?.img,
    firstCard?.image1,
    firstCard?.image2,
    /* "/placeholder.svg?height=600&width=800" */
  );
  const heroName = (firstCard?.name || "Fabrics").toString();
  const heroAlt = heroName;

  const overviewImage = pickImageNotEq(
    heroImage,
    firstCard?.image2,
    firstCard?.image1,
    firstCard?.img,
   /*  "/placeholder.svg?height=500&width=600" */
  );
  const overviewAlt = firstCard?.name
    ? `${firstCard.name} — secondary view`
    : "";

  // Allow passing custom props without touching ContactForm's types
  const AnyContactForm = ContactForm as any;

  return (
    <main className="min-h-screen bg-white">
      {/* HERO */}
<section className="hero relative bg-white text-slate-900 overflow-hidden pt-4 pb-8 sm:pt-8">
  <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
    <div className="flex flex-col lg:grid lg:grid-cols-2 gap-8 items-center">
      {/* Left */}
      <div className="space-y-8 w-full mt-6 lg:mt-0">
        <h1 className="text-3xl sm:text-4xl lg:text-6xl font-bold leading-tight">
          <>
            Premium{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-emerald-700">
              {heroName}
            </span>{" "}
            for Global Manufacturers
          </>
        </h1>

        <p className="text-base sm:text-xl text-slate-700 max-w-2xl">
          Connect with leading fabric suppliers worldwide. Quality textiles,
          competitive pricing, and reliable supply chains.
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
                <span className="ml-2 text-slate-900">${firstCardSeo.salesPrice}</span>
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
            href="#catalog"
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


      {/* COMPANY OVERVIEW */}
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
                As a premier B2B fabric supplier, we specialize in providing
                high-quality textiles to global garment manufacturers, clothing
                retailers, and fabric trading companies. Our extensive network spans
                across major textile hubs worldwide, ensuring consistent supply
                chains and competitive pricing for bulk fabric orders.
              </p>

              <p className="text-lg text-slate-700 leading-relaxed">
                Our commitment to excellence extends beyond product quality to
                encompass reliable logistics, flexible payment terms, and
                comprehensive customer support. Whether you&rsquo;re sourcing fabrics for
                fast fashion, luxury apparel, or industrial textiles, our team
                delivers customized solutions.
              </p>

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

      {/* TRUSTED BY */}
      <section className="py-16 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              Trusted by Leading Brands Worldwide
            </h2>
            <p className="text-slate-600">
              Ships to 50+ countries • MOQ 100 meters • 24-hour response time
            </p>
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
                <h3 className="text-xl font-bold text-slate-900 mb-2">
                  Success Story
                </h3>
                <p className="text-slate-600">
                  How Acme Apparel reduced lead times by 30% with our fabrics
                </p>
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
                <a
                  href="#case-study"
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Read Full Case Study →
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PROCESS */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
              Simple Buying Process  abc
            </h2>
            <p className="text-slate-600 mt-2">
              From sampling to shipment—optimized for speed and quality.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {[
              { step: "1", title: "Brief & Samples", text: "Share GSM, blend, finish and colors." },
              { step: "2", title: "Quote & Lead Time", text: "Clear pricing & timelines upfront." },
              { step: "3", title: "PO & Production", text: "QC checks across the production run." },
              { step: "4", title: "Logistics & Delivery", text: "Global shipping with tracking." },
            ].map((s) => (
              <div
                key={s.step}
                className="bg-slate-50 border border-slate-200 rounded-xl p-6"
              >
                <div className="w-10 h-10 rounded-lg bg-emerald-500 text-white flex items-center justify-center font-bold">
                  {s.step}
                </div>
                <div className="font-semibold mt-4">{s.title}</div>
                <div className="text-sm text-slate-600 mt-2">{s.text}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRODUCTS */}
      <ProductCategoriesApi />

      {/* FAQ */}
      <FAQ />

      {/* CONTACT */}
      <section id="contact" className="py-20 bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6 text-center">
            Get Your Custom Quote Today
          </h2>
          <div className="grid lg:grid-cols-2 gap-16">
            {/* Use `as any` to avoid changing ContactForm's types right now */}
            <AnyContactForm
              submitAction={submitContact}
              saveDraftAction={saveContactDraft}
              // these two props can be read by your client form if needed:
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
