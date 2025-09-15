"use client"

import { useEffect } from "react"

// Analytics tracking utility for A/B testing
export function useAnalyticsTracker() {
  const trackEvent = (eventName: string, properties: Record<string, any>) => {
    // In production, this would send to your analytics service
    console.log("Analytics Event:", eventName, properties)

    // Example: Send to Google Analytics, Mixpanel, etc.
    // gtag('event', eventName, properties)
    // mixpanel.track(eventName, properties)
  }

  const trackSuccessAnimationVariant = (variant: string, action: string) => {
    trackEvent("success_animation_ab_test", {
      variant,
      action,
      timestamp: new Date().toISOString(),
      user_agent: navigator.userAgent,
      screen_resolution: `${screen.width}x${screen.height}`,
    })
  }

  return {
    trackEvent,
    trackSuccessAnimationVariant,
  }
}

// Component to track page views and initialize analytics
export function AnalyticsTracker() {
  const { trackEvent } = useAnalyticsTracker()

  useEffect(() => {
    // Track page view
    trackEvent("page_view", {
      page: window.location.pathname,
      timestamp: new Date().toISOString(),
    })

    // Track success animation variant assignment
    const variant = localStorage.getItem("success_animation_variant")
    if (variant) {
      trackEvent("ab_test_variant_assigned", {
        test_name: "success_animation",
        variant,
        timestamp: new Date().toISOString(),
      })
    }
  }, [trackEvent])

  return null
}
