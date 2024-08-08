import { withContentlayer } from 'next-contentlayer2'

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || '/design-system'

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['ui', 'common', 'shared-data', 'icons', 'tsconfig'],
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || '/design-system',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'pbs.twimg.com',
      },
    ],
  },
  async redirects() {
    return [
      ...(BASE_PATH.length
        ? [
            {
              source: '/',
              destination: BASE_PATH,
              basePath: false,
              permanent: false,
            },
          ]
        : []),
    ]
  },
}

export default withContentlayer(nextConfig)
