"use client"
import { useState, useEffect } from "react"
import { ContactForm } from "./contact-form"

interface ContactFormModalProps {
  isOpen: boolean
  onClose: () => void
}

export function ContactFormModal({ isOpen, onClose }: ContactFormModalProps) {
  const [mounted, setMounted] = useState(false)

  // ---- ENV (public) with safe fallbacks ----
  const COMPANY_PHONE =
    process.env.NEXT_PUBLIC_COMPANY_PHONE || "+91 9925155141"
  const COMPANY_EMAIL =
    process.env.NEXT_PUBLIC_COMPANY_EMAIL || "rajesh.goyal@amritafashions.com"
  const COMPANY_ADDRESS =
    process.env.NEXT_PUBLIC_COMPANY_ADDRESS ||
    "404, Safal Prelude, Corporate Rd, Prahlad Nagar, Ahmedabad, Gujarat-380015"

  // sanitize for tel: (keep + and digits)
  const telHref = `tel:${COMPANY_PHONE.replace(/[^\d+]/g, "")}`
  // show address with line breaks
  const addressDisplay = COMPANY_ADDRESS.replace(/,\s*/g, ",\n")

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "unset"
    }
    return () => {
      document.body.style.overflow = "unset"
    }
  }, [isOpen])

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) {
        onClose()
      }
    }
    document.addEventListener("keydown", handleEscape)
    return () => document.removeEventListener("keydown", handleEscape)
  }, [isOpen, onClose])

  if (!mounted) return null
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Get Your Custom Quote</h2>
            <p className="text-slate-600 mt-1">Connect with our fabric specialists for personalized pricing</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="Close modal"
          >
            <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="p-6">
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Contact Form */}
              <div>
                <ContactForm onSuccess={onClose} />
              </div>

              {/* Contact Information */}
              <div className="space-y-6">
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-6 rounded-xl text-white">
                  <h3 className="text-xl font-bold mb-4">Why Choose FabricPro?</h3>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                      <span className="text-sm">ISO Certified Quality Standards</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                      <span className="text-sm">Global Shipping & Logistics</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                      <span className="text-sm">Competitive Bulk Pricing</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                      <span className="text-sm">24/7 Customer Support</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-slate-900">Contact Information</h4>

                  <div className="space-y-3">
                    <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-lg">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <span className="text-blue-600">📞</span>
                      </div>
                      <div>
                        <div className="font-medium text-slate-900">Phone</div>
                        <a href={telHref} className="text-slate-600 hover:text-blue-600 transition-colors">
                          {COMPANY_PHONE}
                        </a>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-lg">
                      <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                        <span className="text-emerald-600">✉️</span>
                      </div>
                      <div>
                        <div className="font-medium text-slate-900">Email</div>
                        <a
                          href={`mailto:${COMPANY_EMAIL}`}
                          className="text-slate-600 hover:text-emerald-600 transition-colors"
                        >
                          {COMPANY_EMAIL}
                        </a>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-lg">
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                        <span className="text-purple-600">🏢</span>
                      </div>
                      <div>
                        <div className="font-medium text-slate-900">Office</div>
                        <div className="text-slate-600 whitespace-pre-line">
                          {addressDisplay}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-blue-50 to-emerald-50 p-4 rounded-lg border border-blue-100">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-white text-sm">💾</span>
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900 mb-1">Auto-Save Enabled</div>
                      <div className="text-sm text-slate-600">
                        Your form progress is automatically saved as you type. You can safely close this window and
                        return later to continue where you left off.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {/* /Contact Information */}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
