/* eslint-disable turbo/no-undeclared-env-vars */
const isDev = process.env.NODE_ENV === 'development'

if (!process.env.VELITE_STARTED && isDev) {
  process.env.VELITE_STARTED = '1'
  const { build } = await import('velite')
  await build({ watch: true, clean: false })
}

const rawBasePath = process.env.NEXT_PUBLIC_BASE_PATH || 'design-system'
const BASE_PATH = rawBasePath.startsWith('/') ? rawBasePath : `/${rawBasePath}`

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['ui', 'common', 'shared-data', 'icons', 'tsconfig'],
  basePath: BASE_PATH,
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
  // Turbopack configuration to handle .md files with raw-loader
  turbopack: {
    rules: {
      '*.md': {
        loaders: ['raw-loader'],
        as: '*.js',
      },
    },
  },
}

export default nextConfig
