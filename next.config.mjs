/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [{ source: "/chat", destination: "http://127.0.0.1:5000/chat" }];
  },

  images: {
    // ✅ enable Next.js image optimization + srcset generation
    // (remove the old `unoptimized: true`)
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com", pathname: "/**" },
      { protocol: "https", hostname: "i.ibb.co", pathname: "/**" },            // optional: keep if you use it
      { protocol: "https", hostname: "lh3.googleusercontent.com", pathname: "/**" }, // optional
      { protocol: "http", hostname: "localhost", pathname: "/**" },            // optional (dev)
    ],
    formats: ["image/avif", "image/webp"],
    // Controls widths emitted in srcset
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
