/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Only enable static export for Electron build, not for development
  ...(process.env.NODE_ENV === 'production' && process.env.BUILD_FOR_ELECTRON === 'true' ? {
    output: 'export',
    trailingSlash: true,
    assetPrefix: './',
    distDir: 'out',
  } : {
    // Development configuration
    reactStrictMode: true,
  }),
}

export default nextConfig