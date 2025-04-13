import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ["gold-capitalist-bison-622.mypinata.cloud", "api.dicebear.com"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "gold-capitalist-bison-622.mypinata.cloud",
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
