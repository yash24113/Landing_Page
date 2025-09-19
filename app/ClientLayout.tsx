"use client"

import type React from "react"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { StickyContactButton } from "@/components/sticky-contact-button"

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <Navigation />
      <main>{children}</main>
      <StickyContactButton />
      <Footer />
    </>
  )
}
