import type { NextConfig } from "next";

const nextConfig: any = {
  /* config options here */
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    allowedDevOrigins: ['10.1.5.206', 'localhost:3000']
  }
};

export default nextConfig;
