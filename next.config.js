/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  typescript: {
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    ignoreBuildErrors: true,
  },
  experimental: {
    // This is experimental but can help resolve issues with the build
    serverActions: false,
    // Disable server components for API-only usage
    serverComponents: false
  }
}

module.exports = nextConfig 