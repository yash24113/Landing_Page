"use client"
import Image from "next/image"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import { useIsMobile } from "@/hooks/use-mobile"

const categories = [
  {
    name: "Cotton Fabrics1",
    description: "Premium cotton textiles for apparel and home textiles",
    image: "/placeholder.svg?height=300&width=400",
    features: ["100% Pure Cotton", "Various Weights", "Custom Colors"],
    slug: "cotton-fabrics",
  },
  {
    name: "Silk Fabrics2",
    description: "Luxury silk materials for high-end fashion",
    image: "/placeholder.svg?height=300&width=400",
    features: ["Mulberry Silk", "Natural Sheen", "Premium Quality"],
    slug: "silk-fabrics",
  },
  {
    name: "Synthetic Blends3",
    description: "Durable polyester and cotton blends",
    image: "/placeholder.svg?height=300&width=400",
    features: ["Wrinkle Resistant", "Easy Care", "Cost Effective"],
    slug: "synthetic-blends",
  },
  {
    name: "Technical Textiles4",
    description: "Performance fabrics for specialized applications",
    image: "/placeholder.svg?height=300&width=400",
    features: ["Moisture Wicking", "UV Protection", "Antimicrobial"],
    slug: "technical-textiles",
  },
  {
    name: "Cotton Fabrics5",
    description: "Premium cotton textiles for apparel and home textiles",
    image: "/placeholder.svg?height=300&width=400",
    features: ["100% Pure Cotton", "Various Weights", "Custom Colors"],
    slug: "cotton-fabrics",
  },
  {
    name: "Silk Fabrics6",
    description: "Luxury silk materials for high-end fashion",
    image: "/placeholder.svg?height=300&width=400",
    features: ["Mulberry Silk", "Natural Sheen", "Premium Quality"],
    slug: "silk-fabrics",
  },
  {
    name: "Synthetic Blends7",
    description: "Durable polyester and cotton blends",
    image: "/placeholder.svg?height=300&width=400",
    features: ["Wrinkle Resistant", "Easy Care", "Cost Effective"],
    slug: "synthetic-blends",
  },
  {
    name: "Technical Textiles8",
    description: "Performance fabrics for specialized applications",
    image: "/placeholder.svg?height=300&width=400",
    features: ["Moisture Wicking", "UV Protection", "Antimicrobial"],
    slug: "technical-textiles",
  },
]

export function ProductCategories() {
  const isMobile = useIsMobile()
  const groupSize = isMobile ? 1 : 4
  const grouped = Array.from({ length: Math.ceil(categories.length / groupSize) }, (_, i) =>
    categories.slice(i * groupSize, i * groupSize + groupSize)
  )
  return (
    <section id="products" className="py-20 bg-white" aria-labelledby="product-categories">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 id="product-categories" className="text-3xl sm:text-4xl font-bold text-slate-900 mb-6">
            Explore Our Fabric Catalog
          </h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Comprehensive range of premium fabrics for every manufacturing need
          </p>
        </div>

        <Carousel className="px-6 sm:px-10 md:px-16">{/* padding to make room for arrows */}
          <CarouselContent>
            {grouped.map((group, groupIndex) => (
              <CarouselItem key={groupIndex}>
                <div className={`grid gap-8 ${isMobile ? 'grid-cols-1' : 'md:grid-cols-2 lg:grid-cols-4'}`}>
                  {group.map((category, index) => (
                    <article key={category.slug} className="group cursor-pointer">
                      <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-slate-100 hover:border-blue-200">
                        <div className="relative overflow-hidden">
                          <Image
                            src={category.image || "/placeholder.svg"}
                            alt={`${category.name} - ${category.description}`}
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
                            {category.name}
                          </h3>
                          <p className="text-slate-600 mb-4 leading-relaxed">{category.description}</p>

                          <ul className="space-y-2" role="list">
                            {category.features.map((feature, featureIndex) => (
                              <li key={featureIndex} className="flex items-center text-sm text-slate-500">
                                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mr-3" aria-hidden="true" />
                                {feature}
                              </li>
                            ))}
                          </ul>

                          <button
                            className="mt-6 w-full bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-600 py-3 px-4 rounded-lg font-medium transition-all duration-200 border border-slate-200 hover:border-blue-200"
                            aria-label={`View details for ${category.name}`}
                          >
                            View Details
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>

          <CarouselPrevious aria-label="Previous products" className="left-3 md:left-4 z-20" />
          <CarouselNext aria-label="Next products" className="right-3 md:right-4 z-20" />
        </Carousel>
      </div>
    </section>
  )
}
