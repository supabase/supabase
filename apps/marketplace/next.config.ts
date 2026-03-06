import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["ui", "ui-patterns", "common", "shared-data", "icons", "tsconfig"],
  cacheComponents: true,
};

export default nextConfig;
