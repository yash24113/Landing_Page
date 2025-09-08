"use client"

import type React from "react"

import { useEffect } from "react"
import { env } from "@/lib/env"

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Initialize Google Analytics
    if (env.NEXT_PUBLIC_GA_MEASUREMENT_ID) {
      const script = document.createElement("script")
      script.src = `https://www.googletagmanager.com/gtag/js?id=${env.NEXT_PUBLIC_GA_MEASUREMENT_ID}`
      script.async = true
      document.head.appendChild(script)

      window.dataLayer = window.dataLayer || []
      function gtag(...args: any[]) {
        window.dataLayer.push(arguments)
      }
      gtag("js", new Date())
      gtag("config", env.NEXT_PUBLIC_GA_MEASUREMENT_ID)
    }

    // Initialize Facebook Pixel
    if (env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID) {
      const script = document.createElement("script")
      script.innerHTML = `
        !function(f,b,e,v,n,t,s)
        {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
        n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t,s)}(window, document,'script',
        'https://connect.facebook.net/en_US/fbevents.js');
        fbq('init', '${env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID}');
        fbq('track', 'PageView');
      `
      document.head.appendChild(script)
    }

    // Initialize Hotjar
    if (env.NEXT_PUBLIC_HOTJAR_ID) {
      const script = document.createElement("script")
      script.innerHTML = `
        (function(h,o,t,j,a,r){
          h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
          h._hjSettings={hjid:${env.NEXT_PUBLIC_HOTJAR_ID},hjsv:6};
          a=o.getElementsByTagName('head')[0];
          r=o.createElement('script');r.async=1;
          r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;
          a.appendChild(r);
        })(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');
      `
      document.head.appendChild(script)
    }
  }, [])

  return <>{children}</>
}

// Declare global types for analytics
declare global {
  interface Window {
    dataLayer: any[]
    gtag: (...args: any[]) => void
    fbq: (...args: any[]) => void
    hj: (...args: any[]) => void
  }
}
