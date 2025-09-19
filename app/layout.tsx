// app/layout.tsx
import type { ReactNode } from "react";
import Script from "next/script";
import "./globals.css";
import Navigation from "@/components/navigation"; // ensure this is a SERVER component for zero JS

export const dynamic = "force-static";
export const revalidate = 2592000; // 30 days (same as 2,592,000s)

const IS_PROD = process.env.NODE_ENV === "production";
const GA_ID = process.env.NEXT_PUBLIC_GA_ID;               // e.g. G-XXXX
const CLARITY_ID = process.env.NEXT_PUBLIC_CLARITY_ID;     // e.g. abcdef1234
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className="scroll-smooth"
      data-ga={GA_ID ? "1" : "0"}
      data-clarity={CLARITY_ID ? "1" : "0"}
      data-site-url={SITE_URL}
    >
      <head>
        {/* Preconnect only if we actually load those scripts */}
        {IS_PROD && GA_ID && (
          <>
            <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
            <link rel="preconnect" href="https://www.googletagmanager.com" crossOrigin="" />
            <link rel="dns-prefetch" href="https://www.google-analytics.com" />
            <link rel="preconnect" href="https://www.google-analytics.com" crossOrigin="" />
          </>
        )}
        {IS_PROD && CLARITY_ID && (
          <>
            <link rel="dns-prefetch" href="https://www.clarity.ms" />
            <link rel="preconnect" href="https://www.clarity.ms" crossOrigin="" />
          </>
        )}
        {/* You can add your canonical/meta tags here if needed */}
      </head>

      <body className="font-system antialiased">
        {/* Server-only nav → 0KB client JS */}
        <Navigation />

        <main>{children}</main>

        {/* ✅ Load analytics AFTER interactive and only in production */}
        {IS_PROD && GA_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="ga4-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA_ID}', { anonymize_ip: true });
              `}
            </Script>
          </>
        )}

        {IS_PROD && CLARITY_ID && (
          <Script id="ms-clarity" strategy="afterInteractive">
            {`
              (function(c,l,a,r,i,t,y){
                c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
              })(window,document,"clarity","script","${CLARITY_ID}");
            `}
          </Script>
        )}
      </body>
    </html>
  );
}
