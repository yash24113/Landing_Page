// app/layout.tsx
import type { ReactNode } from "react";
import Script from "next/script";
import ClientLayout from "./ClientLayout";
import "./globals.css";

export const dynamic = 'force-static';
export const revalidate = 2592000;

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;           // e.g. G-XXXXXXXXXX
const CLARITY_ID = process.env.NEXT_PUBLIC_CLARITY_ID; // e.g. abcdef1234
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className="scroll-smooth"
      title="Amrita Global Enterprises"
      data-ga={GA_ID ? "1" : "0"}
     data-clarity={CLARITY_ID ? "1" : "0"}
     data-site-url={SITE_URL}
    >
      <body className="font-system antialiased">
        {/* Google Analytics 4 (gtag.js) */}
        {GA_ID && (
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

        {/* Microsoft Clarity */}
        {CLARITY_ID && (
          <Script id="ms-clarity" strategy="afterInteractive">
            {`
              (function(c,l,a,r,i,t,y){
                  c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                  t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                  y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
              })(window, document, "clarity", "script", "${CLARITY_ID}");
            `}
          </Script>
        )}

        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
