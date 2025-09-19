# Product Name Integration

This feature dynamically displays the product name in the hero section based on the slug and API data.

## Environment Configuration

The API URLs are now configurable through environment variables. Create a `.env.local` file in your project root with the following configuration:

```bash
# API Configuration
NEXT_PUBLIC_API_BASE_URL=http://localhost:7000
```

You can also copy from the `env.example` file and modify as needed.

## How it works

1. **API Integration**: The system fetches data from two endpoints:
   - `{NEXT_PUBLIC_API_BASE_URL}/api/seo` - Contains SEO data with product references
   - `{NEXT_PUBLIC_API_BASE_URL}/api/product` - Contains product details

2. **Matching Logic**: The system matches `seo.product` with `product._id` to find the correct product name

3. **Display**: The product name is displayed in the format: "Premium {ProductName} for Global Manufacturers"

## Files Modified

### `lib/env.ts`
- Added `NEXT_PUBLIC_API_BASE_URL` environment variable
- Added `getApiUrl()` helper function for constructing API URLs

### `lib/seo.ts`
- Added `ProductData` interface
- Added `fetchProductData()` function to fetch product data
- Added `getProductNameForSlug()` function to match SEO and product data
- Updated to use environment variables for API URLs

### `app/[slug]/page.tsx`
- Updated to fetch product name using `getProductNameForSlug()`
- Modified hero section to display dynamic product name
- Updated structured data to include product name
- Added error handling and logging

## API Response Format

### SEO API (`/api/seo`)
```json
{
  "success": true,
  "message": "SEO data retrieved successfully",
  "data": [
    {
      "_id": "6890a65adaedbde02f6a5bd9",
      "product": "6890a640daedbde02f6a5bc3",
      "slug": "product-slug",
      // ... other SEO fields
    }
  ]
}
```

### Product API (`/api/product`)
```json
{
  "success": true,
  "data": [
    {
      "_id": "688b29465f64c891cb7fda2d",
      "name": "Product Name",
      "slug": "product-slug",
      // ... other product fields
    }
  ]
}
```

## Usage

The feature automatically works when:
1. A user visits a slug page (e.g., `/vivek-vk`)
2. The SEO API returns data for that slug
3. The product API contains a product with matching ID
4. The product name is displayed in the hero section

## Error Handling

- If no SEO data is found for the slug, falls back to "Premium Fabric"
- If no product is found matching the SEO product ID, falls back to "Premium Fabric"
- All errors are logged to console for debugging
- Network errors are handled gracefully

## Testing

To test the feature:
1. Create a `.env.local` file with your API configuration
2. Ensure your API server is running at the configured URL
3. Visit a slug page that has corresponding SEO and product data
4. Check the browser console for debug logs
5. Verify the product name appears in the hero section

## Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `NEXT_PUBLIC_API_BASE_URL` | Base URL for your API server | `http://localhost:7000` | Yes |

## Production Deployment

For production, make sure to:
1. Set `NEXT_PUBLIC_API_BASE_URL` to your production API URL
2. Ensure your API server is accessible from your Next.js application
3. Test the API endpoints before deploying
