import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Safe performance optimizations only
  reactStrictMode: false,

  // Build optimizations
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },

  // Webpack optimizations - Simplified for stability
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@/backend': path.resolve(__dirname, 'backend'),
    };
    return config;
  },
};

export default nextConfig;
