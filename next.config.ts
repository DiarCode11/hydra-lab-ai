import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  allowedDevOrigins: ['hydralab.online', '161.97.97.21'],
  output: "standalone",
};

export default nextConfig;
