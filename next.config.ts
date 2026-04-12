import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { hostname: '**.cdninstagram.com' },
      { hostname: '**.fbcdn.net' },
      { hostname: 'scontent.cdninstagram.com' },
      { hostname: 'p16-sign-sg.tiktokcdn.com' },
      { hostname: '**.tiktokcdn.com' },
      { hostname: '**.googleusercontent.com' },
      { hostname: '**.ggpht.com' },
    ],
  },
};

export default nextConfig;
