# SEO Implementation Testing Guide

## 🧪 Testing the SEO Implementation

### Prerequisites
1. Make sure your Next.js development server is running: `npm run dev`
2. Ensure your API server is running at `http://localhost:7000`

### Test Cases

#### 1. Test with Matching Slug
**URL**: `http://localhost:3000/vivek-vk-1-1`

**Expected Behavior**:
- ✅ Page loads with proper CSS styling
- ✅ Dynamic SEO meta tags are rendered in `<head>`
- ✅ Product title and description are displayed
- ✅ Product details (SKU, price, rating) are shown
- ✅ JSON-LD structured data is included

**Check Page Source**:
```html
<head>
  <title>Dynamic Title from API</title>
  <meta name="description" content="Dynamic description from API">
  <meta property="og:title" content="Open Graph Title">
  <meta property="og:description" content="Open Graph Description">
  <!-- ... other meta tags ... -->
</head>
```

#### 2. Test with Non-Matching Slug
**URL**: `http://localhost:3000/test-slug`

**Expected Behavior**:
- ✅ Page loads with proper CSS styling
- ✅ Static fallback SEO meta tags are rendered
- ✅ "Page Not Found" message is displayed
- ✅ "Go Back Home" button is shown

#### 3. Test API Connection Error
**URL**: `http://localhost:3000/vivek-vk-1-1` (with API server stopped)

**Expected Behavior**:
- ✅ Page loads with proper CSS styling
- ✅ Static fallback SEO meta tags are rendered
- ✅ Error message is displayed
- ✅ "Go Back Home" button is shown

### Console Logs to Check

When testing, check the browser console for these log messages:

#### ✅ Successful API Call:
```
🔍 Fetching SEO data for slug: vivek-vk-1-1
📡 Making API request to: http://localhost:7000/api/seo
✅ API response received: {success: true, data: [...], total: 1}
📊 Found 1 SEO records
✅ Found matching SEO data for slug: vivek-vk-1-1
```

#### ❌ No Matching Slug:
```
🔍 Fetching SEO data for slug: test-slug
📡 Making API request to: http://localhost:7000/api/seo
✅ API response received: {success: true, data: [...], total: 1}
📊 Found 1 SEO records
❌ No SEO data found for slug: test-slug
📋 Available slugs: ["vivek-vk-1-1"]
```

#### ❌ API Connection Error:
```
🔍 Fetching SEO data for slug: vivek-vk-1-1
📡 Making API request to: http://localhost:7000/api/seo
❌ Error fetching SEO data for slug vivek-vk-1-1: TypeError: fetch failed
🌐 Network error - Make sure your API server is running at http://localhost:7000
```

### Visual Verification

#### ✅ Proper CSS Styling:
- Hero section with gradient background
- White text on dark background
- Proper spacing and typography
- Responsive grid layout
- Product cards with proper styling

#### ✅ SEO Meta Tags:
- Check page source for `<title>` tag
- Look for OpenGraph meta tags
- Verify Twitter Card meta tags
- Check for canonical URL
- Ensure JSON-LD structured data is present

### API Response Format

Your API should return data in this format:
```json
{
  "success": true,
  "message": "SEO data retrieved successfully",
  "data": [
    {
      "slug": "vivek-vk-1-1",
      "title": "Product Title",
      "description": "Product Description",
      "keywords": "keyword1, keyword2",
      "author_name": "Author Name",
      "canonical_url": "https://domain.com/vivek-vk-1-1",
      "ogTitle": "Open Graph Title",
      "ogDescription": "Open Graph Description",
      "ogSiteName": "Site Name",
      "ogType": "website",
      "ogUrl": "https://domain.com/vivek-vk-1-1",
      "twitterCard": "summary_large_image",
      "twitterTitle": "Twitter Title",
      "twitterDescription": "Twitter Description",
      "twitterSite": "@sitehandle",
      "openGraph": {
        "images": ["image1.jpg", "image2.jpg"],
        "video": {
          "url": "video.mp4",
          "secure_url": "https://domain.com/video.mp4",
          "type": "video/mp4",
          "width": 1920,
          "height": 1080
        }
      },
      "twitter": {
        "image": "twitter-image.jpg",
        "player": "player-url",
        "player_width": 480,
        "player_height": 270
      },
      "BreadcrumbJsonLd": "{...}",
      "LocalBusinessJsonLd": "{...}",
      "LogoJsonLd": "{...}",
      "VideoJsonLd": "{...}",
      "viewport": "width=device-width, initial-scale=1",
      "themeColor": "#ffffff",
      "robots": "index, follow",
      "charset": "utf-8",
      "contentLanguage": "en",
      "googleSiteVerification": "verification-code",
      "formatDetection": "telephone=no",
      "mobileWebAppCapable": "yes",
      "msValidate": "validation-code",
      "appleStatusBarStyle": "default",
      "xUaCompatible": "IE=edge",
      "hreflang": "en-US",
      "x_default": "default-url",
      "sku": "vivek kalal",
      "salesPrice": 21,
      "purchasePrice": 23,
      "rating_value": 5,
      "rating_count": 5,
      "popularproduct": true,
      "topratedproduct": true,
      "productIdentifier": "bkb",
      "locationCode": "dsd",
      "description_html": "<p>Product description with HTML</p>"
    }
  ],
  "total": 1
}
```

### Troubleshooting

#### Issue: CSS not applying
**Solution**: Check that `app/globals.css` is imported in `app/layout.tsx`

#### Issue: Meta tags not rendering
**Solution**: Verify that `generateMetadata` function is working and check browser console for errors

#### Issue: API connection errors
**Solution**: Ensure API server is running at `http://localhost:7000`

#### Issue: Page not found for valid slug
**Solution**: Check API response format and verify slug matching logic

### Performance Testing

1. **First Load**: Check page load time with network throttling
2. **SEO Data**: Verify meta tags are rendered server-side
3. **Fallback**: Test with API server down to ensure graceful degradation
4. **Caching**: Check if SEO data is properly cached

### Accessibility Testing

1. **Screen Reader**: Test with screen reader software
2. **Keyboard Navigation**: Ensure all elements are keyboard accessible
3. **Focus Management**: Check focus indicators are visible
4. **Color Contrast**: Verify text meets WCAG guidelines 