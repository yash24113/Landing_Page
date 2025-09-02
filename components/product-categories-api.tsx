"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import { useIsMobile } from "@/hooks/use-mobile"

// ---------------------------
// Types
// ---------------------------
type Product = {
  _id: string
  name: string
  img?: string
  image1?: string
  image2?: string
  productdescription?: string
  slug?: string
}

type IdLike = string | { _id?: string } | null | undefined

type Seo = {
  _id: string
  product: IdLike
  location: IdLike
  slug: string
}

type LocationDoc = {
  _id: string
  name: string
  slug?: string
}

// Props so the parent (page.tsx) can pass a same-location list directly
type Props = {
  /** Optional: ready-to-render products (e.g., same-location, hero excluded) */
  initialProducts?: Product[]
  /** Optional: default location id (if you want to force a location on non-slug pages) */
  defaultLocationId?: string
  /** Optional: default location name (used only if id not given), default "ahmedabad" */
  defaultLocationName?: string
}

// ---------------------------
// API URLs
// ---------------------------
const RAW_BASE = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") ?? ""
const PRODUCT_URL = RAW_BASE ? `${RAW_BASE}/product` : "http://localhost:7000/landing/product"
const SEO_URL = RAW_BASE ? `${RAW_BASE}/seo/landing-page` : "http://localhost:7000/landing/seo/landing-page"
const LOC_URL = RAW_BASE ? `${RAW_BASE}/locations` : "http://localhost:7000/landing/locations"

const API_KEY = process.env.NEXT_PUBLIC_API_KEY ?? ""
const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? ""
// Align default header name with your server-side default
const API_KEY_HEADER = process.env.NEXT_PUBLIC_API_KEY_HEADER ?? "x-api-key-yash"
const ADMIN_EMAIL_HEADER = process.env.NEXT_PUBLIC_ADMIN_EMAIL_HEADER ?? "x-admin-email"

// ---------------------------
// Helpers
// ---------------------------
function normalizeSlug(s: string) {
  return String(s ?? "")
    .toLowerCase()
    .replace(/^\/+|\/+$/g, "")
    .replace(/\?.*$/, "")
}
function getPageSlugFromPath(pathname: string) {
  const clean = normalizeSlug(pathname || "/")
  if (!clean) return ""
  const parts = clean.split("/")
  return parts[parts.length - 1] || ""
}
function extractId(v: IdLike): string {
  if (!v) return ""
  if (typeof v === "string") return v.trim()
  if (typeof v === "object" && v._id) return String(v._id).trim()
  return ""
}

export function ProductCategoriesApi({
  initialProducts,
  defaultLocationId,
  defaultLocationName = "ahmedabad",
}: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const pageSlug = useMemo(() => getPageSlugFromPath(pathname), [pathname])

  const isMobile = useIsMobile()
  const groupSize = isMobile ? 1 : 4

  const [products, setProducts] = useState<Product[]>([])
  const [seos, setSeos] = useState<Seo[]>([])
  const [locations, setLocations] = useState<LocationDoc[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    const controller = new AbortController()

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const headers: Record<string, string> = {}
        if (API_KEY) headers[API_KEY_HEADER] = API_KEY
        if (ADMIN_EMAIL) headers[ADMIN_EMAIL_HEADER] = ADMIN_EMAIL

        // If parent already gave products, we can skip fetching /product for performance
        const needProductFetch = !initialProducts || initialProducts.length === 0

        const [seoRes, locRes, prodRes] = await Promise.all([
          fetch(SEO_URL, { headers, signal: controller.signal }),
          fetch(LOC_URL, { headers, signal: controller.signal }),
          needProductFetch ? fetch(PRODUCT_URL, { headers, signal: controller.signal }) : Promise.resolve(null as any),
        ])

        if (!seoRes.ok) throw new Error(`SEO fetch failed: ${seoRes.status}`)
        if (!locRes.ok) throw new Error(`Locations fetch failed: ${locRes.status}`)
        const seoJson = await seoRes.json()
        const locJson = await locRes.json()
        const prodJson = needProductFetch ? await (prodRes as Response).json() : null

        if (!alive) return
        setSeos(Array.isArray(seoJson?.data) ? (seoJson.data as Seo[]) : [])
        setLocations(Array.isArray(locJson?.data?.locations) ? (locJson.data.locations as LocationDoc[]) : [])
        setProducts(
          initialProducts && initialProducts.length > 0
            ? initialProducts
            : Array.isArray(prodJson?.data)
            ? (prodJson.data as Product[])
            : []
        )
      } catch (e: any) {
        if (!alive) return
        setError(e?.message || "Failed to load data")
      } finally {
        if (alive) setLoading(false)
      }
    }

    load()
    return () => {
      alive = false
      controller.abort()
    }
  }, [pageSlug, initialProducts])

  // Current SEO (only when we are on a slug page); null on "/"
  const currentSeo = useMemo(() => {
    const slug = pageSlug
    if (!slug) return null
    return seos.find((s) => normalizeSlug(s.slug) === slug) || null
  }, [seos, pageSlug])

  // Target Location ID
  const targetLocationId = useMemo(() => {
    if (currentSeo) return extractId(currentSeo.location)
    if (defaultLocationId) return defaultLocationId

    // Non-slug page: find by name (default "ahmedabad")
    const byName = locations.find(
      (l) => String(l?.name ?? "").trim().toLowerCase() === defaultLocationName.toLowerCase()
    )
    if (byName?._id) return byName._id

    // Fallback: first available from any SEO
    for (const s of seos) {
      const id = extractId(s.location)
      if (id) return id
    }
    return ""
  }, [currentSeo, locations, seos, defaultLocationId, defaultLocationName])

  // Map productId -> slug (prefer SEO slug; fallback to product.slug so navigation always works)
  const productSlugById = useMemo(() => {
    const map = new Map<string, string>()

    // 1) from product list
    for (const p of products) {
      if (p?._id && p.slug) {
        const id = p._id.trim()
        if (id && !map.has(id)) map.set(id, p.slug.trim())
      }
    }
    // 2) overlay SEO slugs (if present)
    for (const s of seos) {
      const pid = extractId(s.product)
      const sl = s.slug?.trim()
      if (pid && sl) map.set(pid, sl)
    }
    return map
  }, [products, seos])

  // Set of product IDs that belong to the target location (from SEO rows)
  const targetLocationProductIds = useMemo(() => {
    if (!targetLocationId) return new Set<string>()
    const ids = new Set<string>()
    for (const s of seos) {
      if (extractId(s.location) === targetLocationId) {
        const pid = extractId(s.product)
        if (pid) ids.add(pid)
      }
    }
    return ids
  }, [seos, targetLocationId])

  // Current page's product (only if on slug page)
  const currentProductId = useMemo(() => extractId(currentSeo?.product), [currentSeo])

  // The location name (for header suffix)
  const locationName = useMemo(() => {
    if (!targetLocationId) return ""
    const found = locations.find((l) => l._id === targetLocationId)
    return found?.name || found?.slug || ""
  }, [locations, targetLocationId])

  // Build the list to render (exclude hero/current product)
  const listToShow = useMemo(() => {
    if (initialProducts && initialProducts.length > 0) {
      return currentProductId ? initialProducts.filter((p) => p._id.trim() !== currentProductId) : initialProducts
    }

    if (targetLocationProductIds.size === 0) return []
    const inLocation = products.filter((p) => targetLocationProductIds.has(p._id.trim()))
    return currentProductId ? inLocation.filter((p) => p._id.trim() !== currentProductId) : inLocation
  }, [initialProducts, products, targetLocationProductIds, currentProductId])

  // Group for carousel
  const grouped = useMemo(() => {
    const out: Product[][] = []
    const g = Math.max(1, groupSize)
    for (let i = 0; i < listToShow.length; i += g) {
      out.push(listToShow.slice(i, i + g))
    }
    return out
  }, [listToShow, groupSize])

  // Client-side navigation (no reload)
  function goToProduct(productId: string) {
    const sl = productSlugById.get(productId)
    if (!sl) return
    router.push(`/${sl}`)
  }

  const titleSuffix =
    listToShow.length > 0 && locationName ? ` — Related in ${locationName}` : ""

  return (
    <section id="products" className="py-20 bg-white" aria-labelledby="product-categories">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 id="product-categories" className="text-3xl sm:text-4xl font-bold text-slate-900 mb-6">
            Explore Our Fabric Catalog{titleSuffix}
          </h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Comprehensive range of premium fabrics for every manufacturing need
          </p>
        </div>

        {loading ? (
          <div className="text-center text-slate-500">Loading products...</div>
        ) : error ? (
          <div className="text-center text-red-600">Failed to load products: {error}</div>
        ) : listToShow.length === 0 ? (
          <div className="text-center text-slate-600">
            {currentSeo ? "No related products for this page." : "No products for the selected location."}
          </div>
        ) : (
          <Carousel className="px-6 sm:px-10 md:px-16">
            <CarouselContent>
              {grouped.map((group, pageIndex) => (
                <CarouselItem key={pageIndex}>
                  <div className={`grid gap-8 ${isMobile ? "grid-cols-1" : "md:grid-cols-2 lg:grid-cols-4"}`}>
                    {group.map((p, index) => {
                      const img =
                        p.img?.trim() ||
                        p.image1?.trim() ||
                        p.image2?.trim() ||
                        "/placeholder.svg?height=300&width=400"

                      const targetSlug = productSlugById.get(p._id)
                      const disabled = !targetSlug

                      const handleClick = () => {
                        if (!disabled) goToProduct(p._id)
                      }
                      const handleKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
                        if (!disabled && (e.key === "Enter" || e.key === " ")) {
                          e.preventDefault()
                          goToProduct(p._id)
                        }
                      }

                      return (
                        <article
                          key={p._id}
                          className={`group ${disabled ? "cursor-not-allowed" : "cursor-pointer"}`}
                          onClick={handleClick}
                          onKeyDown={handleKeyDown}
                          role="button"
                          tabIndex={disabled ? -1 : 0}
                          aria-disabled={disabled}
                          title={disabled ? "No details available" : `View details for ${p.name}`}
                        >
                          <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-slate-100 hover:border-blue-200">
                            <div className="relative overflow-hidden">
                              <Image
                                src={img}
                                alt={`${p.name} - ${p.productdescription ?? ""}`}
                                width={400}
                                height={300}
                                loading={index < 2 ? "eager" : "lazy"}
                                className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            </div>

                            <div className="p-6">
                              <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-blue-600 transition-colors">
                                {p.name}
                              </h3>
                              <p className="text-slate-600 mb-4 leading-relaxed">
                                {p.productdescription || "—"}
                              </p>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  if (!disabled) goToProduct(p._id)
                                }}
                                disabled={disabled}
                                className={`mt-6 w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 border ${
                                  disabled
                                    ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                                    : "bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-600 border-slate-200 hover:border-blue-200"
                                }`}
                                aria-label={disabled ? "No details available" : `View details for ${p.name}`}
                              >
                                View Details
                              </button>
                            </div>
                          </div>
                        </article>
                      )
                    })}
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>

            <CarouselPrevious aria-label="Previous products" className="left-3 md:left-4 z-20" />
            <CarouselNext aria-label="Next products" className="right-3 md:right-4 z-20" />
          </Carousel>
        )}
      </div>
    </section>
  )
}
