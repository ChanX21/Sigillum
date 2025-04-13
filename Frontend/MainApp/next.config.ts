import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'gold-capitalist-bison-622.mypinata.cloud',
        pathname: '/ipfs/**',
      },
    ],
  },
};

export default nextConfig;
