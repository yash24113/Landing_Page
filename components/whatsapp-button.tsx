"use client"

import { useState, useEffect } from 'react'

export function WhatsAppButton() {
  const [isVisible, setIsVisible] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 2000)
    return () => clearTimeout(timer)
  }, [])

  const handleWhatsAppClick = () => {
    const message = encodeURIComponent(
      "Hi! 👋 I'm interested in your fabric products. Could you please provide me with more information about your collection, pricing, and minimum order quantities? Thank you!"
    )
    const phoneNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer')
  }

  return (
    <>
      <div
        className={`fixed bottom-6 right-6 z-50 transition-all duration-700 ease-in-out ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
        }`}
      >
        {/* Tooltip (kept visual only) */}
        {isHovered && (
          <div
            role="tooltip"
            id="whatsapp-tooltip"
            className="absolute bottom-full right-0 mb-3 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg whitespace-nowrap"
          >
            <div className="flex items-center space-x-2">
              <span>Chat with us on WhatsApp</span>
              <div className="w-2 h-2 bg-gray-900 transform rotate-45 absolute -bottom-1 right-4" />
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={handleWhatsAppClick}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className="group relative flex items-center justify-center w-16 h-16 bg-green-500 hover:bg-green-600 text-white rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-110 animate-top-bottom"
          style={{
            boxShadow: '0 8px 32px rgba(34, 197, 94, 0.4)',
            background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
          }}
          /* 👇 Accessible name & association with tooltip */
          aria-label="Open WhatsApp chat"
          title="Open WhatsApp chat"
          aria-describedby={isHovered ? 'whatsapp-tooltip' : undefined}
        >
          {/* Visually hidden text ensures a name even if aria-label is removed */}
          <span className="sr-only">Open WhatsApp chat</span>

          {/* Ripple (decorative) */}
          <div className="absolute inset-0 rounded-full bg-white opacity-0 group-hover:opacity-20 group-hover:scale-150 transition-all duration-300" aria-hidden="true" />

          {/* WhatsApp Icon (decorative) */}
          <svg
            className="w-7 h-7 relative z-10 animate-pulse"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
            focusable="false"
          >
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884" />
          </svg>

          {/* Notification dot (decorative) */}
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-ping" aria-hidden="true" />
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full" aria-hidden="true" />
        </button>
      </div>

      {/* Existing CSS unchanged */}
      <style jsx>{`
        @keyframes top-bottom {
          0% { transform: translateY(-20px); }
          50% { transform: translateY(0px); }
          100% { transform: translateY(-20px); }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.05); opacity: 0.9; }
        }
        @keyframes ping {
          75%, 100% { transform: scale(2); opacity: 0; }
        }
        .animate-top-bottom { animation: top-bottom 2s ease-in-out infinite; }
        .animate-pulse { animation: pulse 2s ease-in-out infinite; }
        .animate-ping { animation: ping 1s cubic-bezier(0, 0, 0.2, 1) infinite; }
        .shadow-3xl { box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); }
        .animate-top-bottom:hover { animation: top-bottom 1s ease-in-out infinite; filter: drop-shadow(0 0 8px rgba(34, 197, 94, 0.6)); }
        @media (max-width: 768px) { .animate-top-bottom { animation: top-bottom 1.5s ease-in-out infinite; } }
      `}</style>
    </>
  )
}
