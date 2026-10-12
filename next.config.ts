import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  serverExternalPackages: ["bcryptjs", "@prisma/client", "prisma"],
};

export default nextConfig;
