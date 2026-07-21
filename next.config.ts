import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable standalone output for Vercel deployment
  output: "standalone",

  // Allow remote images if needed
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },

  // Skip TS build errors in production (optional, for smoother deployments)
  // typescript: {
  //   ignoreBuildErrors: true,
  // },
};

export default nextConfig;