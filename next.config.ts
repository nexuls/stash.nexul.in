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
