/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable eslint during build
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Disable type checking during build for speed
  typescript: {
    ignoreBuildErrors: true,
  },
};

module.exports = nextConfig; 