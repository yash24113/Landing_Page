'use client';

import { useEffect } from 'react';

interface JsonLdInjectorProps {
  videoLd?: any;
  logoLd?: any;
  breadcrumbLd?: any;
  localBusinessLd?: any;
  productLd?: any;
  organizationLd?: any;
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
  faqLd,
}: JsonLdInjectorProps) {
  useEffect(() => {
    const blocks = [
      { id: 'video-json-ld', data: videoLd },
      { id: 'logo-json-ld', data: logoLd },
      { id: 'breadcrumb-json-ld', data: breadcrumbLd },
      { id: 'local-business-json-ld', data: localBusinessLd },
      { id: 'product-json-ld', data: productLd },
      { id: 'organization-json-ld', data: organizationLd },
      { id: 'website-json-ld', data: websiteLd },
      { id: 'faq-json-ld', data: faqLd },
    ];

    // inject or update each JSON-LD script
    blocks.forEach(({ id, data }) => {
      const existing = document.getElementById(id);
      if (data) {
        const json = JSON.stringify(data, null, 2);
        if (existing) {
          existing.textContent = json;
        } else {
          const script = document.createElement('script');
          script.id = id;
          script.type = 'application/ld+json';
          script.textContent = json;
          document.head.appendChild(script);
        }
      } else if (existing) {
        existing.remove();
      }
    });
  }, [videoLd, logoLd, breadcrumbLd, localBusinessLd, productLd, organizationLd, websiteLd, faqLd]);

  return null; // nothing to render into the DOM tree
}
