import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  devIndicators: false,
  poweredByHeader: false,
  compress: true,
  experimental: {
    optimizePackageImports: ["lucide-react", "recharts", "date-fns"],
  },
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
