import { PHASE_DEVELOPMENT_SERVER } from "next/constants.js";

/** @type {(phase: string) => import('next').NextConfig} */
const nextConfig = (phase) => ({
  distDir: phase === PHASE_DEVELOPMENT_SERVER ? ".next-dev" : ".next",
  experimental: {
    // libsql มีไฟล์ native จึงไม่ให้ webpack รวมเข้า bundle
    serverComponentsExternalPackages: ["@libsql/client", "libsql"],
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
});

export default nextConfig;

