'use client';

interface JsonLdDebugProps {
  videoLd?: any;
  logoLd?: any;
  breadcrumbLd?: any;
  localBusinessLd?: any;
  productLd: any;
  organizationLd: any;
  websiteLd?: any;
  faqLd?: any;
}

export default function JsonLdDebug({
  videoLd,
  logoLd,
  breadcrumbLd,
  localBusinessLd,
  productLd,
  organizationLd,
  websiteLd,
  faqLd
}: JsonLdDebugProps) {
  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  const allData = {
    videoLd,
    logoLd,
    breadcrumbLd,
    localBusinessLd,
    productLd,
    organizationLd,
    websiteLd,
    faqLd
  };

  return (
    <div className="fixed bottom-4 right-4 bg-black text-white p-4 rounded-lg max-w-md max-h-96 overflow-auto text-xs z-50">
      <h3 className="font-bold mb-2">JSON-LD Debug (Dev Only)</h3>
      <div className="space-y-2">
        {Object.entries(allData).map(([key, value]) => (
          <div key={key}>
            <div className="font-semibold text-green-400">{key}:</div>
            {value ? (
              <pre className="text-xs bg-gray-800 p-2 rounded overflow-auto">
                {JSON.stringify(value, null, 2)}
              </pre>
            ) : (
              <span className="text-gray-400">null</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
