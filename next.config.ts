import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Trade-in photo uploads and admin image manager (multi-file)
      bodySizeLimit: "50mb",
    },
  },
  images: {
    remotePatterns: [
      {
        // Supabase Storage public bucket (vehicle images)
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
