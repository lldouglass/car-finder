import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/blog/how-long-does-a-subaru-outback-last",
        destination: "/blog/how-long-does-subaru-outback-last",
        permanent: true, // 301
      },
    ];
  },
};

export default nextConfig;
