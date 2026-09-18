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
      {
        protocol: "https",
        hostname: "assets.dpsteam.kr",
        pathname: "/brend/D-Black.png",
      },
      {
        protocol: "https",
        hostname: "i.scdn.co",
        pathname: "/image/**",
      },
    ],
  },
};

export default nextConfig;
