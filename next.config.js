/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // Disable page optimization since we're only using API routes
  optimizeFonts: false,
  images: {
    unoptimized: true,
  },
  // Disable unnecessary features
  reactStrictMode: false,
  swcMinify: true,
  typescript: {
    ignoreBuildErrors: true,
  }
}

module.exports = nextConfig 