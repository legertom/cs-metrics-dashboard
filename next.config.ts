import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  // Needed when this app lives inside a mono-repo with a parent lockfile.
  experimental: {
    outputFileTracingRoot: path.join(__dirname, '../../'),
  },
};

export default nextConfig;
