import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  allowedDevOrigins: ["http://127.0.0.1:3000", "http://localhost:3000", "http://21.0.17.239:3000"],
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
