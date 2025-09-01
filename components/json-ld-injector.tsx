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
  // Create a single @graph with all entities to avoid duplicates
  const allItems = [
    videoLd,
    logoLd,
    organizationLd, // Organization first
    breadcrumbLd,
    localBusinessLd,
    productLd,
    websiteLd,
    faqLd
  ].filter(Boolean);

  const graphData = {
    "@context": "https://schema.org",
    "@graph": allItems
  };

  return (
    <script
      id="structured-data-graph"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(graphData, null, 2) }}
    />
  );
}
