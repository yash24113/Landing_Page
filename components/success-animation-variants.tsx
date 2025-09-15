"use client"

import { useEffect, useState } from "react"

interface SuccessAnimationProps {
  isVisible: boolean
  onComplete: () => void
  customerName?: string
  variant?: "default" | "minimal" | "celebration" | "professional"
}

// A/B Testing variant selector
export function useSuccessAnimationVariant() {
  const [variant, setVariant] = useState<"default" | "minimal" | "celebration" | "professional">("default")

  useEffect(() => {
    // Get or set variant from localStorage for consistent experience
    const savedVariant = localStorage.getItem("success_animation_variant")

    if (savedVariant && ["default", "minimal", "celebration", "professional"].includes(savedVariant)) {
      setVariant(savedVariant as any)
    } else {
      // Randomly assign variant for A/B testing
      const variants = ["default", "minimal", "celebration", "professional"]
      const randomVariant = variants[Math.floor(Math.random() * variants.length)]
      setVariant(randomVariant as any)
      localStorage.setItem("success_animation_variant", randomVariant)

      // Track variant assignment
      console.log("A/B Test - Success Animation Variant:", randomVariant)
    }
  }, [])

  return variant
}

export function SuccessAnimationVariants({
  isVisible,
  onComplete,
  customerName,
  variant = "default",
}: SuccessAnimationProps) {
  const [animationStep, setAnimationStep] = useState(0)

  useEffect(() => {
    if (!isVisible) {
      setAnimationStep(0)
      return
    }

    // Track animation view
    console.log("A/B Test - Animation Viewed:", variant)

    const timeouts: NodeJS.Timeout[] = []

    // Different timing for each variant
    const timings = {
      default: [100, 300, 800, 1200, 1600, 6000],
      minimal: [50, 200, 500, 3000], // Faster, simpler
      celebration: [100, 400, 900, 1400, 1800, 2200, 7000], // More steps
      professional: [150, 400, 800, 1000, 5000], // Business-focused timing
    }

    const variantTimings = timings[variant]

    variantTimings.forEach((timing, index) => {
      timeouts.push(
        setTimeout(() => {
          if (index === variantTimings.length - 1) {
            onComplete()
          } else {
            setAnimationStep(index + 1)
          }
        }, timing),
      )
    })

    return () => {
      timeouts.forEach(clearTimeout)
    }
  }, [isVisible, onComplete, variant])

  if (!isVisible) return null

  // Render different variants
  switch (variant) {
    case "minimal":
      return (
        <MinimalSuccessAnimation animationStep={animationStep} onComplete={onComplete} customerName={customerName} />
      )
    case "celebration":
      return (
        <CelebrationSuccessAnimation
          animationStep={animationStep}
          onComplete={onComplete}
          customerName={customerName}
        />
      )
    case "professional":
      return (
        <ProfessionalSuccessAnimation
          animationStep={animationStep}
          onComplete={onComplete}
          customerName={customerName}
        />
      )
    default:
      return (
        <DefaultSuccessAnimation animationStep={animationStep} onComplete={onComplete} customerName={customerName} />
      )
  }
}

// Default Variant (Original)
function DefaultSuccessAnimation({
  animationStep,
  onComplete,
  customerName,
}: { animationStep: number; onComplete: () => void; customerName?: string }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div
        className={`absolute inset-0 transition-all duration-500 ${
          animationStep >= 1 ? "bg-black/50 backdrop-blur-sm" : "bg-transparent"
        }`}
        onClick={onComplete}
      />

      <div
        className={`relative bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full mx-4 transform transition-all duration-700 ${
          animationStep >= 1 ? "scale-100 opacity-100 translate-y-0" : "scale-75 opacity-0 translate-y-8"
        }`}
      >
        {/* Confetti */}
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
              }}
            />
          ))}
        </div>

        {/* Checkmark */}
        <div className="text-center mb-6">
          <div
            className={`relative mx-auto w-20 h-20 rounded-full transition-all duration-500 ${
              animationStep >= 2 ? "bg-gradient-to-r from-emerald-400 to-emerald-600 scale-100" : "bg-gray-200 scale-75"
            }`}
          >
            <svg
              className={`absolute inset-0 w-full h-full transition-all duration-700 ${animationStep >= 2 ? "opacity-100" : "opacity-0"}`}
              viewBox="0 0 24 24"
              fill="none"
            >
              <path
                d="M9 12l2 2 4-4"
                stroke="white"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                  strokeDasharray: 100,
                  strokeDashoffset: animationStep >= 2 ? 0 : 100,
                  transition: "stroke-dashoffset 1s ease-in-out",
                }}
              />
            </svg>
            {animationStep >= 2 && (
              <>
                <div className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-20"></div>
                <div className="absolute inset-0 rounded-full bg-emerald-400 animate-pulse opacity-10"></div>
              </>
            )}
          </div>
        </div>

        <div
          className={`text-center transition-all duration-500 ${animationStep >= 3 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
        >
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Quote Request Submitted!</h2>
          <p className="text-slate-600 mb-6">
            {customerName
              ? `Thank you ${customerName}! Your quote request has been successfully submitted.`
              : "Your quote request has been successfully submitted."}
          </p>
        </div>

        <div
          className={`space-y-4 mb-6 transition-all duration-500 delay-200 ${animationStep >= 4 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
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
        </div>

        <div
          className={`space-y-3 transition-all duration-500 delay-300 ${animationStep >= 5 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
        >
          <div className="flex space-x-3">
            <a
              href="tel:+1234567890"
              className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-3 px-4 rounded-lg font-semibold text-center transition-all duration-200 transform hover:scale-105"
            >
              📞 Call Now
            </a>
            <a
              href="https://wa.me/+1234567890"
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

        <button
          onClick={onComplete}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}

// Minimal Variant - Clean and fast
function MinimalSuccessAnimation({
  animationStep,
  onComplete,
  customerName,
}: { animationStep: number; onComplete: () => void; customerName?: string }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div
        className={`absolute inset-0 transition-all duration-300 ${animationStep >= 1 ? "bg-black/30" : "bg-transparent"}`}
        onClick={onComplete}
      />

      <div
        className={`relative bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full mx-4 transform transition-all duration-500 ${animationStep >= 1 ? "scale-100 opacity-100" : "scale-90 opacity-0"}`}
      >
        <div className="text-center">
          <div
            className={`mx-auto w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center mb-4 transition-all duration-300 ${animationStep >= 2 ? "scale-100" : "scale-0"}`}
          >
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <div className={`transition-all duration-300 delay-100 ${animationStep >= 3 ? "opacity-100" : "opacity-0"}`}>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Request Sent!</h3>
<p className="text-slate-600 text-sm mb-4">We&rsquo;ll get back to you within 24 hours.</p>

            <button
              onClick={onComplete}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Celebration Variant - Maximum excitement
function CelebrationSuccessAnimation({
  animationStep,
  onComplete,
  customerName,
}: { animationStep: number; onComplete: () => void; customerName?: string }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div
        className={`absolute inset-0 transition-all duration-500 ${animationStep >= 1 ? "bg-gradient-to-br from-purple-900/50 to-blue-900/50 backdrop-blur-sm" : "bg-transparent"}`}
        onClick={onComplete}
      />

      <div
        className={`relative bg-gradient-to-br from-white to-blue-50 rounded-3xl shadow-2xl p-8 max-w-lg w-full mx-4 transform transition-all duration-700 ${animationStep >= 1 ? "scale-100 opacity-100 rotate-0" : "scale-50 opacity-0 rotate-12"}`}
      >
        {/* Fireworks */}
        <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
          {[...Array(30)].map((_, i) => (
            <div
              key={i}
              className={`absolute transition-all duration-2000 ${animationStep >= 2 ? "animate-ping" : "opacity-0"}`}
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 1}s`,
              }}
            >
              <div className="w-1 h-1 bg-yellow-400 rounded-full"></div>
              <div className="w-1 h-1 bg-pink-400 rounded-full absolute top-1"></div>
              <div className="w-1 h-1 bg-blue-400 rounded-full absolute left-1"></div>
            </div>
          ))}
        </div>

        {/* Animated Trophy */}
        <div className="text-center mb-6">
          <div
            className={`relative mx-auto w-24 h-24 transition-all duration-1000 ${animationStep >= 2 ? "scale-100 rotate-0" : "scale-0 rotate-180"}`}
          >
            <div className="w-full h-full bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center text-4xl animate-bounce">
              🏆
            </div>
            {animationStep >= 3 && (
              <div className="absolute -inset-4 border-4 border-yellow-400 rounded-full animate-ping opacity-30"></div>
            )}
          </div>
        </div>

        <div
          className={`text-center transition-all duration-500 ${animationStep >= 3 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
        >
          <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-3">
            🎉 Congratulations! 🎉
          </h2>
          <p className="text-slate-700 mb-2 font-medium">
            {customerName ? `${customerName}, your quote request is on its way!` : "Your quote request is on its way!"}
          </p>
<p className="text-slate-600 text-sm mb-6">You&rsquo;re one step closer to premium fabrics!</p>
        </div>

        <div
          className={`space-y-4 mb-6 transition-all duration-500 delay-200 ${animationStep >= 4 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
        >
          <div className="bg-gradient-to-r from-purple-100 to-blue-100 p-4 rounded-xl border border-purple-200">
            <div className="text-center">
              <div className="text-2xl mb-2">🚀</div>
              <div className="font-bold text-slate-900 mb-1">Premium Service Activated!</div>
              <div className="text-sm text-slate-600">Priority response • Dedicated support • Best pricing</div>
            </div>
          </div>
        </div>

        <div
          className={`space-y-3 transition-all duration-500 delay-300 ${animationStep >= 5 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
        >
          <div className="grid grid-cols-2 gap-3">
            <a
              href="tel:+1234567890"
              className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white py-3 px-4 rounded-xl font-bold text-center transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              📞 Call VIP Line
            </a>
            <a
              href="https://wa.me/+1234567890"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-3 px-4 rounded-xl font-bold text-center transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              💬 Chat Now
            </a>
          </div>

          <div
            className={`text-center transition-all duration-500 delay-500 ${animationStep >= 6 ? "opacity-100" : "opacity-0"}`}
          >
            <button
              onClick={onComplete}
              className="text-slate-500 hover:text-slate-700 py-2 text-sm transition-colors underline"
            >
              Continue exploring
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Professional Variant - Business-focused
function ProfessionalSuccessAnimation({
  animationStep,
  onComplete,
  customerName,
}: { animationStep: number; onComplete: () => void; customerName?: string }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div
        className={`absolute inset-0 transition-all duration-400 ${animationStep >= 1 ? "bg-slate-900/60 backdrop-blur-sm" : "bg-transparent"}`}
        onClick={onComplete}
      />

      <div
        className={`relative bg-white rounded-lg shadow-2xl max-w-2xl w-full mx-4 transform transition-all duration-600 ${animationStep >= 1 ? "scale-100 opacity-100" : "scale-95 opacity-0"}`}
      >
        <div className="border-l-4 border-blue-600 bg-gradient-to-r from-blue-50 to-white p-6">
          <div className="flex items-start space-x-4">
            <div
              className={`flex-shrink-0 transition-all duration-500 ${animationStep >= 2 ? "scale-100" : "scale-0"}`}
            >
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" />
                </svg>
              </div>
            </div>

            <div
              className={`flex-1 transition-all duration-500 delay-100 ${animationStep >= 3 ? "opacity-100 translate-x-0" : "opacity-0 translate-x-4"}`}
            >
              <h3 className="text-xl font-bold text-slate-900 mb-2">Quote Request Confirmed</h3>
              <p className="text-slate-600 mb-4">
                {customerName ? `Dear ${customerName}, t` : "T"}hank you for your interest in our premium fabric
                solutions. Your request has been received and assigned reference #FR-
                {Math.random().toString(36).substr(2, 6).toUpperCase()}.
              </p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div
            className={`transition-all duration-500 delay-200 ${animationStep >= 4 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
          >
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-4">
                <h4 className="font-semibold text-slate-900 flex items-center">
                  <span className="w-2 h-2 bg-blue-600 rounded-full mr-3"></span>
                  Next Steps
                </h4>
                <ul className="space-y-2 text-sm text-slate-600 ml-5">
                  <li>• Technical review within 2 hours</li>
                  <li>• Detailed quotation within 24 hours</li>
                  <li>• Account manager assignment</li>
                  <li>• Sample preparation if required</li>
                </ul>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold text-slate-900 flex items-center">
                  <span className="w-2 h-2 bg-emerald-600 rounded-full mr-3"></span>
                  Your Benefits
                </h4>
                <ul className="space-y-2 text-sm text-slate-600 ml-5">
                  <li>• Priority customer status</li>
                  <li>• Competitive bulk pricing</li>
                  <li>• Quality guarantee</li>
                  <li>• Global logistics support</li>
                </ul>
              </div>
            </div>

            <div className="border-t border-slate-200 pt-6">
              <div className="flex flex-col sm:flex-row gap-3">
                <a
                  href="tel:+1234567890"
                  className="flex-1 bg-slate-900 hover:bg-slate-800 text-white py-3 px-6 rounded-lg font-medium text-center transition-colors flex items-center justify-center space-x-2"
                >
                  <span>📞</span>
                  <span>Direct Line: +1 (234) 567-8900</span>
                </a>
                <a
                  href="mailto:sales@fabricpro.com"
                  className="flex-1 border border-slate-300 hover:border-slate-400 text-slate-700 py-3 px-6 rounded-lg font-medium text-center transition-colors flex items-center justify-center space-x-2"
                >
                  <span>✉️</span>
                  <span>sales@fabricpro.com</span>
                </a>
              </div>

              <div className="text-center mt-4">
                <button onClick={onComplete} className="text-slate-500 hover:text-slate-700 text-sm transition-colors">
                  Return to website
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
