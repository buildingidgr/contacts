/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  typescript: {
    ignoreBuildErrors: true
  },
  // Disable all UI-related features
  images: false,
  reactStrictMode: false,
  optimizeFonts: false,
  compress: true,
  poweredByHeader: false
}

module.exports = nextConfig 