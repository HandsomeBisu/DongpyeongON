import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "assets.dpsteam.kr",
        pathname: "/dpon/**",
      },
    ],
  },
};

export default nextConfig;
