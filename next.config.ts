import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["firebase-admin", "@google-cloud/firestore"],
  typescript: {
    // We run strict type-checking separately via npx tsc --noEmit
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
