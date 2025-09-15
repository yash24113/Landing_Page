"use client"

import { useEffect, useState } from "react"

interface SuccessAnimationProps {
  isVisible: boolean
  onComplete: () => void
  customerName?: string
}

export function SuccessAnimation({ isVisible, onComplete, customerName }: SuccessAnimationProps) {
  const [animationStep, setAnimationStep] = useState(0)

  useEffect(() => {
    if (!isVisible) {
      setAnimationStep(0)
      return
    }

    const timeouts: NodeJS.Timeout[] = []

    // Step 1: Fade in background
    timeouts.push(setTimeout(() => setAnimationStep(1), 100))

    // Step 2: Show checkmark animation
    timeouts.push(setTimeout(() => setAnimationStep(2), 300))

    // Step 3: Show success message
    timeouts.push(setTimeout(() => setAnimationStep(3), 800))

    // Step 4: Show details
    timeouts.push(setTimeout(() => setAnimationStep(4), 1200))

    // Step 5: Show action buttons
    timeouts.push(setTimeout(() => setAnimationStep(5), 1600))

    // Auto-close after 5 seconds if no interaction
    timeouts.push(
      setTimeout(() => {
        onComplete()
      }, 6000),
    )

    return () => {
      timeouts.forEach(clearTimeout)
    }
  }, [isVisible, onComplete])

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      {/* Animated Background */}
      <div
        className={`absolute inset-0 transition-all duration-500 ${
          animationStep >= 1 ? "bg-black/50 backdrop-blur-sm" : "bg-transparent"
        }`}
        onClick={onComplete}
      />

      {/* Success Card */}
      <div
        className={`relative bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full mx-4 transform transition-all duration-700 ${
          animationStep >= 1 ? "scale-100 opacity-100 translate-y-0" : "scale-75 opacity-0 translate-y-8"
        }`}
      >
        {/* Confetti Background */}
        <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className={`absolute w-2 h-2 rounded-full transition-all duration-1000 ${
                animationStep >= 2 ? "animate-bounce" : "opacity-0"
              }`}
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                backgroundColor: ["#3B82F6", "#10B981", "#8B5CF6", "#F59E0B", "#EF4444"][Math.floor(Math.random() * 5)],
                animationDelay: `${Math.random() * 0.5}s`,
                animationDuration: `${1 + Math.random()}s`,
              }}
            />
          ))}
        </div>

        {/* Checkmark Animation */}
        <div className="text-center mb-6">
          <div
            className={`relative mx-auto w-20 h-20 rounded-full transition-all duration-500 ${
              animationStep >= 2 ? "bg-gradient-to-r from-emerald-400 to-emerald-600 scale-100" : "bg-gray-200 scale-75"
            }`}
          >
            {/* Checkmark SVG */}
            <svg
              className={`absolute inset-0 w-full h-full transition-all duration-700 ${
                animationStep >= 2 ? "opacity-100" : "opacity-0"
              }`}
              viewBox="0 0 24 24"
              fill="none"
            >
              <path
                className={`transition-all duration-1000 ${
                  animationStep >= 2
                    ? "stroke-dasharray-100 stroke-dashoffset-0"
                    : "stroke-dasharray-100 stroke-dashoffset-100"
                }`}
                d="M9 12l2 2 4-4"
                stroke="white"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                  strokeDasharray: 100,
                  strokeDashoffset: animationStep >= 2 ? 0 : 100,
                }}
              />
            </svg>

            {/* Pulse rings */}
            {animationStep >= 2 && (
              <>
                <div className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-20"></div>
                <div className="absolute inset-0 rounded-full bg-emerald-400 animate-pulse opacity-10"></div>
              </>
            )}
          </div>
        </div>

        {/* Success Message */}
        <div
          className={`text-center transition-all duration-500 ${
            animationStep >= 3 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Quote Request Submitted!</h2>
          <p className="text-slate-600 mb-6">
            {customerName
              ? `Thank you ${customerName}! Your quote request has been successfully submitted.`
              : "Your quote request has been successfully submitted."}
          </p>
        </div>

        {/* Details */}
        <div
          className={`space-y-4 mb-6 transition-all duration-500 delay-200 ${
            animationStep >= 4 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <div className="bg-gradient-to-r from-blue-50 to-emerald-50 p-4 rounded-xl border border-blue-100">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-white text-sm">⏱️</span>
              </div>
              <div>
                <div className="font-semibold text-slate-900 mb-1">What happens next?</div>
               <ul className="text-sm text-slate-600 space-y-1">
  <li>• Our team will review your requirements</li>
  <li>• You&rsquo;ll receive a detailed quote within 24 hours</li>
  <li>• We&rsquo;ll schedule a consultation call if needed</li>
</ul>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="bg-slate-50 p-3 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">24h</div>
              <div className="text-xs text-slate-600">Response Time</div>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg">
              <div className="text-2xl font-bold text-emerald-600">500+</div>
              <div className="text-xs text-slate-600">Happy Clients</div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div
          className={`space-y-3 transition-all duration-500 delay-300 ${
            animationStep >= 5 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <div className="flex space-x-3">
            <a
              href="tel:+1234567890"
              className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-3 px-4 rounded-lg font-semibold text-center transition-all duration-200 transform hover:scale-105"
            >
              📞 Call Now
            </a>
            <a
              href="https://wa.me/+1234567890?text=Hi! I just submitted a quote request and would like to discuss my requirements."
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg font-semibold text-center transition-all duration-200 transform hover:scale-105"
            >
              💬 WhatsApp
            </a>
          </div>

          <button
            onClick={onComplete}
            className="w-full text-slate-600 hover:text-slate-800 py-2 text-sm transition-colors"
          >
            Continue browsing
          </button>
        </div>

        {/* Close button */}
        <button
          onClick={onComplete}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 transition-colors"
          aria-label="Close success message"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}
