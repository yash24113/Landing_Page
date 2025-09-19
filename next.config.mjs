/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [{ source: "/chat", destination: "http://127.0.0.1:5000/chat" }];
  },

  async headers() {
    return [
      {
        // Apply to all routes
        source: "/:path*",
        headers: [
          // ✅ Client Hints: browser sends DPR, Width, Viewport-Width
          { key: "Accept-CH", value: "DPR, Width, Viewport-Width" },

          // ✅ Tell caches (Vercel, Cloudflare, browser) that response may vary
          { key: "Vary", value: "DPR, Width, Viewport-Width" },

          // ✅ Performance hints
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
    ];
  },

  images: {
    // ✅ enable Next.js image optimization + srcset generation
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com", pathname: "/**" },
      { protocol: "https", hostname: "i.ibb.co", pathname: "/**" },
      { protocol: "https", hostname: "lh3.googleusercontent.com", pathname: "/**" },
      { protocol: "http", hostname: "localhost", pathname: "/**" }, // dev only
    ],
    formats: ["image/avif", "image/webp"],
    deviceSizes: [320, 420, 640, 750, 828, 1080, 1200, 1600, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },

  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
};

export default nextConfig;
