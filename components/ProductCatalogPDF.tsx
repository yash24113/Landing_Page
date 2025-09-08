import { Document, Page, Text, View, StyleSheet, Image, Link } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  imageContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 16,
  },
  mainImageContainer: {
    width: '60%',
    height: 180, // Fixed height to match the design
    marginTop: 10,
  },
  mainImage: {
    width: '100%',
    height: '100%',  // Make it fill the container
    objectFit: 'cover',  // Changed back to 'cover' to fill the container
    borderRadius: 8,
  },
  additionalImagesContainer: {
    width: '40%',
    gap: 16,
  },
  additionalImageWrapper: {
    width: '100%',
    height: 92, // Reduced from 142
  },
  additionalImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    borderRadius: 8,
  },
  noImagesContainer: {
    width: '100%',
    padding: 40,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    border: '1px dashed #ddd',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 200,
  },
  noImagesText: {
    color: '#666',
    fontSize: 14,
    fontStyle: 'italic',
  },
  page: {
    padding: '15px 40px 30px',
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    padding: '5px 0',
    gap: '15px',
    borderBottom: '1px solid #e5e7eb',
  },
  logoContainer: {
    width: 80,
    height: 40,
  },
  logo: {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
  },
  companyNameContainer: {
    flex: 1,
  },
  companyName: {
    fontSize: 24,
    color: '#065f46', // emerald-800
    fontWeight: 'bold',
    textAlign: 'left',
    lineHeight: 1.2,
  },
  divider: {
    height: 1,
    backgroundColor: '#065f46',
    marginBottom: 20,
  },
  section: {
    marginBottom: 20,
  },
  productHeader: {
    backgroundColor: '#065f46',
    padding: '10px',  // Reduced from 15px
    borderRadius: 4,
    marginBottom: 8,  // Reduced from 10
    textAlign: 'center',
  },
  productName: {
    fontSize: 16,  // Reduced from 20
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 2,  // Reduced from 4
  },
  productSku: {
    fontSize: 12,  // Reduced from 14
    color: '#d1fae5',
  },
  measurementsContainer: {
    width: '80%',
    padding: 15,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    border: '1px solid #e5e7eb',
  },
  measurementRow: {
    flexDirection: 'row',
    borderBottom: '1px solid #e5e7eb',
    padding: '6px 0',
    gap: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  measurementLabel: {
    fontWeight: 'bold',
    fontSize: 12,
    width: 60,
    textAlign: 'center',
  },
  measurementValue: {
    fontSize: 12,
    width: 60,
    textAlign: 'center',
  },
  label: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  value: {
    fontSize: 12,
    marginBottom: 12,
  },
  description: {
    fontSize: 12,
    lineHeight: 1.5,
    marginTop: 10,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    textAlign: 'center',
    color: '#666666',
    fontSize: 10,
    paddingHorizontal: 40,
  },
  footerText: {
    marginBottom: 4,
    textDecoration: 'none',
  },
});

interface ImageData {
  url: string;
  alt?: string;
}

interface ProductCatalogPDFProps {
  product: {
    name?: string;
    sku?: string;
    salesPrice?: number;
    productdescription?: string;
    img?: string;
    image1?: string;
    image2?: string;
    gsm?: string | number;
    oz?: string | number;
    cm?: string | number;
    inch?: string | number;
  };
}

// Helper function to get image data URL (you might need to adjust this based on your image source)
const getImageUrl = (url: string | undefined): string => {
  console.log('🔍 Processing image URL:', url);
  
  if (!url) {
    console.warn('❌ Image URL is empty or undefined');
    return '';
  }

  try {
    // Handle Cloudinary URLs
    if (url.includes('res.cloudinary.com')) {
      console.log('☁️ Cloudinary URL detected');
      
      // Ensure HTTPS and add version parameter
      let secureUrl = url.replace('http://', 'https://');
      if (!secureUrl.includes('f_auto')) {
        secureUrl = secureUrl.replace('/upload/', '/upload/f_auto/');
      }
      
      // Add version parameter if not present
      if (!secureUrl.includes('?')) {
        secureUrl += '?v=' + Date.now();
      }
      
      console.log('✅ Processed Cloudinary URL:', secureUrl);
      return secureUrl;
    }
    
    // Handle absolute URLs
    if (url.startsWith('http')) {
      console.log('🌐 Absolute URL detected');
      
      // For development, use CORS proxy if needed
      if (process.env.NODE_ENV === 'development' && !url.includes('localhost')) {
        const proxyUrl = `https://cors-anywhere.herokuapp.com/${url}`;
        console.log('🚀 Using CORS proxy for development:', proxyUrl);
        return proxyUrl;
      }
      
      return url;
    }
    
    // Handle data URLs
    if (url.startsWith('data:')) {
      console.log('📊 Data URL detected');
      return url;
    }
    
    // Handle relative paths
    console.log('🔄 Relative URL detected');
    const cleanUrl = url.startsWith('/') ? url.substring(1) : url;
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:7000/landing';
    const fullUrl = `${baseUrl.replace(/\/+$/, '')}/${cleanUrl.replace(/^\/+/, '')}`;
    
    console.log('🔗 Constructed full URL:', fullUrl);
    return fullUrl;
    
  } catch (error) {
    console.error('❌ Error processing image URL:', error);
    return ''; // Return empty string on error
  }
};

export const ProductCatalogPDF = ({ product }: ProductCatalogPDFProps) => {
  console.log('📦 Product data in PDF generator:', {
    name: product.name,
    sku: product.sku,
    hasImages: Boolean(product.img || product.image1 || product.image2),
    imageCount: [product.img, product.image1, product.image2].filter(Boolean).length
  });
  
  // Get all available images with their types and handle potential URL issues
  const allImages = [
    { src: product.img, type: 'main' },
    { src: product.image1, type: 'image1' },
    { src: product.image2, type: 'image2' }
  ].filter(img => {
    if (!img.src) {
      console.warn(`⚠️ Missing image (${img.type})`);
      return false;
    }
    
    // Check if the URL is valid
    try {
      const url = new URL(img.src);
      console.log(`✅ Found valid ${img.type} image URL:`, url.toString());
      return true;
    } catch (e) {
      console.warn(`❌ Invalid URL for ${img.type} image:`, img.src);
      return false;
    }
  });
  
  // Function to get a fallback image when the main image fails to load
  const getFallbackImage = () => {
    // Try to find another available image
    const fallbackImage = allImages.find(img => img.src && img.src !== mainImage?.src);
    return fallbackImage?.src || '';
  };
  
  // Function to render image with error handling
  const renderImage = (src: string, style: any, isMain = false) => {
    const imageUrl = getImageUrl(src);
    console.log(`🖼️ Rendering ${isMain ? 'main' : 'additional'} image:`, imageUrl);
    
    // Image container style
    const containerStyle = {
      ...style,
      border: '1px solid #e2e8f0',
      backgroundColor: '#f8fafc',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
      height: isMain ? 180 : 120, // Reduced main image height to match the second image
      width: '100%',
    };
    
    // Image style
    const imageStyle = {
      width: '100%',
      height: '100%',
      objectFit: 'contain' as const,
    };

    try {
      return (
        <View style={containerStyle}>
          <Image 
            src={imageUrl}
            style={imageStyle}
            cache={false}
            // @ts-ignore - The error prop is not in the type definition but works at runtime
            error={() => (
              <View style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                width: '100%',
                height: '100%',
                padding: 10
              }}>
                <Text style={{ color: '#64748b', fontSize: 10, textAlign: 'center' }}>
                  {isMain ? 'Main ' : ''}Image not available
                </Text>
              </View>
            )}
          />
        </View>
      );
    } catch (error) {
      console.error('❌ Error rendering image:', error);
      return (
        <View style={[imageStyle, { 
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }]}>
          <Text style={{ color: '#ef4444', fontSize: 10 }}>
            Error loading image
          </Text>
        </View>
      );
    }
  };
  
  const hasImages = allImages.length > 0;
  const mainImage = hasImages ? allImages[0] : null;
  const additionalImages = hasImages ? allImages.slice(1, 3) : [];
  
  // Log final image processing
  console.log(`✅ Processed ${allImages.length} images for PDF`);
  console.log('Main image:', mainImage?.type, mainImage?.src);
  console.log('Additional images:', additionalImages.map(img => ({
    type: img.type,
    src: img.src?.substring(0, 50) + '...'
  })));

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Image 
              src="/amrita.png"
              style={styles.logo}
            />
          </View>
          <View style={styles.companyNameContainer}>
            <Text style={styles.companyName}>Amrita Global Enterprises</Text>
          </View>
          <View style={styles.divider} />
        </View>

        <View style={styles.imageContainer}>
          {hasImages ? (
            <>
              {/* Main Image */}
              <View style={[styles.mainImageContainer, { 
                border: '1px solid #e2e8f0',
                borderRadius: 8,
                overflow: 'hidden',
                position: 'relative',
                backgroundColor: '#f8fafc'
              }]}>
                {mainImage?.src ? (
                  <>
                    {renderImage(mainImage.src, styles.mainImage, true)}
                    <Text style={{
                      position: 'absolute',
                      bottom: 8,
                      left: 8,
                      backgroundColor: 'rgba(0,0,0,0.6)',
                      color: 'white',
                      padding: '2px 8px',
                      borderRadius: 4,
                      fontSize: 10,
                      fontWeight: 'bold'
                    }}>
                      {mainImage.type.toUpperCase()}
                    </Text>
                  </>
                ) : (
                  <View style={{ 
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor: '#f1f5f9',
                    border: '2px dashed #cbd5e1',
                    borderRadius: 8,
                    padding: 16
                  }}>
                    <Text style={{ 
                      color: '#64748b', 
                      fontSize: 12,
                      textAlign: 'center',
                      maxWidth: '80%'
                    }}>
                      No main image available
                    </Text>
                  </View>
                )}
              </View>

              {/* Additional Images */}
              <View style={styles.additionalImagesContainer}>
                {additionalImages.map((img, index) => (
                  <View 
                    key={index} 
                    style={[styles.additionalImageWrapper, {
                      border: '1px solid #e2e8f0',
                      borderRadius: 8,
                      overflow: 'hidden',
                      position: 'relative',
                      backgroundColor: '#f8fafc'
                    }]}
                  >
                    <Image 
                      src={getImageUrl(img.src)}
                      style={styles.additionalImage}
                      cache={false}
                    />
                    <Text style={{ 
                      position: 'absolute',
                      bottom: 4,
                      right: 4,
                      backgroundColor: 'rgba(0,0,0,0.6)',
                      color: 'white',
                      padding: '1px 6px',
                      borderRadius: 4,
                      fontSize: 8,
                      fontWeight: 'bold'
                    }}>
                      {img.type.toUpperCase()}
                    </Text>
                  </View>
                ))}
                
                {/* Fill remaining space if less than 2 additional images */}
                {Array.from({ length: 2 - additionalImages.length }).map((_, i) => (
                  <View 
                    key={`empty-${i}`}
                    style={[styles.additionalImageWrapper, {
                      backgroundColor: '#f1f5f9',
                      border: '2px dashed #cbd5e1',
                      borderRadius: 8,
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      padding: 8
                    }]}
                  >
                    <Text style={{ 
                      color: '#64748b', 
                      fontSize: 10,
                      textAlign: 'center'
                    }}>
                      No image {i + 1}
                    </Text>
                  </View>
                ))}
              </View>
            </>
          ) : (
            <View style={styles.noImagesContainer}>
              <Text style={styles.noImagesText}>No images available</Text>
            </View>
          )}
        </View>
        
        <View style={styles.section}>
          <View style={styles.productHeader}>
            <Text style={styles.productName}>{product.name || 'Product Name'}</Text>
            <Text style={styles.productSku}>SKU: {product.sku || 'N/A'}</Text>
          </View>
          
          <View style={{ marginTop: 5, alignItems: 'center' }}>
            <View style={styles.measurementsContainer}>
              <View style={styles.measurementRow}>
                <Text style={styles.measurementLabel}>GSM:</Text>
                <Text style={styles.measurementValue}>{product.gsm || 'N/A'}</Text>
              </View>
              <View style={styles.measurementRow}>
                <Text style={styles.measurementLabel}>OZ:</Text>
                <Text style={styles.measurementValue}>{product.oz || 'N/A'}</Text>
              </View>
              <View style={styles.measurementRow}>
                <Text style={styles.measurementLabel}>CM:</Text>
                <Text style={styles.measurementValue}>{product.cm || 'N/A'}</Text>
              </View>
              <View style={styles.measurementRow}>
                <Text style={styles.measurementLabel}>INCH:</Text>
                <Text style={styles.measurementValue}>{product.inch || 'N/A'}</Text>
              </View>
            </View>
          </View>
          
          {product.productdescription && (
            <View style={{ marginTop: 20 }}>
              <Text style={styles.label}>Description:</Text>
              <Text style={styles.description}>
                {product.productdescription}
              </Text>
            </View>
          )}
        </View>
        
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>{process.env.NEXT_PUBLIC_COMPANY_ADDRESS}</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
            <Link src={`tel:${process.env.NEXT_PUBLIC_office_mobile?.replace(/\D/g, '')}`} style={[styles.footerText, { color: '#1a73e8' }]}>
              {process.env.NEXT_PUBLIC_office_mobile}
            </Link>
            <Text>|</Text>
            <Link src={`tel:${process.env.NEXT_PUBLIC_office_phone?.replace(/\D/g, '')}`} style={[styles.footerText, { color: '#1a73e8' }]}>
              {process.env.NEXT_PUBLIC_office_phone}
            </Link>
            <Text>|</Text>
            <Link src={`https://wa.me/${process.env.NEXT_PUBLIC_office_wa?.replace(/\D/g, '')}`} style={[styles.footerText, { color: '#1a73e8' }]}>
              {process.env.NEXT_PUBLIC_office_wa}
            </Link>
            <Text>|</Text>
            <Link src={`mailto:${process.env.NEXT_PUBLIC_office_email1}`} style={[styles.footerText, { color: '#1a73e8' }]}>
              {process.env.NEXT_PUBLIC_office_email1}
            </Link>

            {process.env.NEXT_PUBLIC_office_website && (
              <>
                <Text>|</Text>
                <Link 
                  src={process.env.NEXT_PUBLIC_office_website}
                  style={[styles.footerText, { color: '#1a73e8' }]}
                >
                  {process.env.NEXT_PUBLIC_office_website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                </Link>
              </>
            )}
          </View>
          <Text style={styles.footerText}>Thank you for your interest in our products! • {new Date().toLocaleDateString()}</Text>
          <Text style={[styles.footerText, { fontSize: 10, color: '#888888' }]}>{typeof window !== 'undefined' ? window.location.href : 'URL not available'}</Text>
        </View>
      </Page>
    </Document>
  );
};
