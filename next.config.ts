import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  async redirects() {
    return [{ source: "/coming-soon", destination: "/how-it-works", permanent: true }];
  },
};

export default nextConfig;
