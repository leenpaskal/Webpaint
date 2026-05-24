import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Allow invoice PDF uploads. Keep this in sync with PDF_MAX_BYTES
      // in src/lib/storage/invoice-storage.ts.
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
