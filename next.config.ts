import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      { source: "/solarsimulator", destination: "/solarsimulator.html" },
      { source: "/solarsimulator/", destination: "/solarsimulator.html" },
    ];
  },
};

export default nextConfig;
