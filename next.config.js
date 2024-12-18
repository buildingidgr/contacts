/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  typescript: {
    ignoreBuildErrors: true
  },
  experimental: {
    // Disable static generation
    staticWorkerRequestDeduping: false,
    staticWorkerThreads: false,
  }
}

module.exports = nextConfig 