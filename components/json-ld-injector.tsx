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
  return (
    <>
      {videoLd && (
        <script
          id="video-json-ld"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(videoLd, null, 2) }}
        />
      )}
      {logoLd && (
        <script
          id="logo-json-ld"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(logoLd, null, 2) }}
        />
      )}
      {breadcrumbLd && (
        <script
          id="breadcrumb-json-ld"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd, null, 2) }}
        />
      )}
      {localBusinessLd && (
        <script
          id="local-business-json-ld"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessLd, null, 2) }}
        />
      )}
      {productLd && (
        <script
          id="product-json-ld"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(productLd, null, 2) }}
        />
      )}
      {organizationLd && (
        <script
          id="organization-json-ld"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationLd, null, 2) }}
        />
      )}
      {websiteLd && (
        <script
          id="website-json-ld"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteLd, null, 2) }}
        />
      )}
      {faqLd && (
        <script
          id="faq-json-ld"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd, null, 2) }}
        />
      )}
    </>
  );
}
