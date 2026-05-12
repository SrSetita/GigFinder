import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['192.168.68.112', 'stability-acceptance-associated-single.trycloudflare.com'],
  async rewrites() {
    return [
      { source: '/api/:path*',       destination: 'http://localhost:4000/api/:path*' },
      { source: '/socket.io/:path*', destination: 'http://localhost:4000/socket.io/:path*' },
    ];
  },
};

export default nextConfig;
