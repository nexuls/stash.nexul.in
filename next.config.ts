/**
 * Next.js application configuration.
 *
 * Defines framework-level build settings, experimental flags, and compiler options
 * for the Stash application.
 *
 * Notable: Evaluated at build and development server initialization time.
 */

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  allowedDevOrigins: ["arch-main"],
  images: {
    // Entry previews that need photographs pull them from the author's
    // Cloudinary account rather than committing megabytes of JPEG beside a
    // note about layout.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/djoo8ogmp/image/upload/**",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: "/stash",
        destination: "/",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
