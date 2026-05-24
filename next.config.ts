import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: ["@clerk/nextjs"]
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.clerk.dev" },
      { protocol: "https", hostname: "img.clerk.com" },
      { protocol: "https", hostname: "**.amazonaws.com" }
    ]
  }
};

export default nextConfig;
