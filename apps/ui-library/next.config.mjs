import { withContentlayer } from 'next-contentlayer2'
import path from 'path'
import { fileURLToPath } from 'url'

// Create __dirname equivalent for ES modules
const __dirname = path.dirname(fileURLToPath(import.meta.url))

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['ui', 'common', 'shared-data', 'icons', 'tsconfig'],
  basePath: process.env.NEXT_PUBLIC_BASE_PATH,
  async redirects() {
    return [
      ...(process.env.NEXT_PUBLIC_BASE_PATH?.length
        ? [
            {
              source: '/',
              destination: process.env.NEXT_PUBLIC_BASE_PATH,
              basePath: false,
              permanent: false,
            },
          ]
        : []),
    ]
  },
  eslint: {
    // We are already running linting via GH action, this will skip linting during production build on Vercel
    ignoreDuringBuilds: true,
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Ensure that all imports of 'yjs' resolve to the same instance
      config.resolve.alias['yjs'] = path.resolve(__dirname, 'node_modules/yjs')
    }
    return config
  },
}

export default withContentlayer(nextConfig)
