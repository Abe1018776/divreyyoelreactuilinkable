// next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: false, // Build will fail on ESLint errors
  },
  typescript: {
    ignoreBuildErrors: false, // Build will fail on TypeScript errors
  },
  images: {
    unoptimized: true, // Set to false if you want to use Next.js Image Optimization later
  },
  // Add any other specific Next.js configurations you might need here later
};

export default nextConfig;