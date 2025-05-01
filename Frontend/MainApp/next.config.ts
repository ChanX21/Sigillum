import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ["gray-academic-grouse-23.mypinata.cloud", "api.dicebear.com"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "gray-academic-grouse-23.mypinata.cloud",
        pathname: "/ipfs/**",
      },
      {
        protocol: "https",
        hostname: "api.dicebear.com",
        pathname: "/7.x/**",
      },
    ],
  },
};

export default nextConfig;
