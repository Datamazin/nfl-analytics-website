import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'a.espncdn.com',
        pathname: '/i/teamlogos/nfl/**',
      },
      {
        protocol: 'https',
        hostname: 'a.espncdn.com',
        pathname: '/combiner/i/**',
      },
      {
        protocol: 'https',
        hostname: 'a.espncdn.com',
        pathname: '/i/headshots/nfl/**',
      },
    ],
  },
};

export default nextConfig;
