import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The audit page used to live at /test; old links (CVs, emails) keep working.
  async redirects() {
    return [{ source: "/test", destination: "/audit", permanent: true }];
  },
};

export default nextConfig;
