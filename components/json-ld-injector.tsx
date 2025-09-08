'use client';

import { useEffect } from 'react';

interface JsonLdInjectorProps {
  videoLd?: any;
  logoLd?: any;
  breadcrumbLd?: any;
  localBusinessLd?: any;
  productLd: any;
  organizationLd: any;
  websiteLd?: any;
  faqLd?: any;
}

export default function JsonLdInjector({
  videoLd,
  logoLd,
  breadcrumbLd,
  localBusinessLd,
  productLd,
  organizationLd,
  websiteLd,
  faqLd
}: JsonLdInjectorProps) {
  useEffect(() => {
    // Function to inject JSON-LD scripts into the document head
    const injectJsonLd = () => {
      // Remove any existing JSON-LD scripts to avoid duplicates
      const existingScripts = document.querySelectorAll('script[type="application/ld+json"]');
      existingScripts.forEach(script => script.remove());

      // Create and inject new JSON-LD scripts
      const scripts = [
        { id: 'video-json-ld', data: videoLd },
        { id: 'logo-json-ld', data: logoLd },
        { id: 'breadcrumb-json-ld', data: breadcrumbLd },
        { id: 'local-business-json-ld', data: localBusinessLd },
        { id: 'product-json-ld', data: productLd },
        { id: 'organization-json-ld', data: organizationLd },
        { id: 'website-json-ld', data: websiteLd },
        { id: 'faq-json-ld', data: faqLd }
      ];

      scripts.forEach(({ id, data }) => {
        if (data) {
          const script = document.createElement('script');
          script.id = id;
          script.type = 'application/ld+json';
          script.textContent = JSON.stringify(data, null, 2);
          document.head.appendChild(script);
        }
      });
    };

    // Inject immediately
    injectJsonLd();

    // Also inject after a small delay to ensure it's in the DOM
    const timer = setTimeout(injectJsonLd, 100);

    return () => {
      clearTimeout(timer);
      // Clean up scripts when component unmounts
      const scripts = document.querySelectorAll('script[type="application/ld+json"]');
      scripts.forEach(script => script.remove());
    };
  }, [videoLd, logoLd, breadcrumbLd, localBusinessLd, productLd, organizationLd, websiteLd, faqLd]);

  // Also render the JSON-LD as hidden divs for better SEO visibility
  return (
    <>
      {/* Hidden JSON-LD data for better SEO visibility */}
      <div style={{ display: 'none' }}>
        {videoLd && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(videoLd, null, 2) }}
          />
        )}
        {logoLd && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(logoLd, null, 2) }}
          />
        )}
        {breadcrumbLd && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd, null, 2) }}
          />
        )}
        {localBusinessLd && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessLd, null, 2) }}
          />
        )}
        {productLd && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(productLd, null, 2) }}
          />
        )}
        {organizationLd && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationLd, null, 2) }}
          />
        )}
        {websiteLd && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteLd, null, 2) }}
          />
        )}
        {faqLd && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd, null, 2) }}
          />
        )}
      </div>
    </>
  );
}