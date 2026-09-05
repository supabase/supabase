/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['ui', 'common', 'shared-data', 'icons', 'tsconfig'],
  basePath: process.env.NEXT_PUBLIC_BASE_PATH,
  turbopack: {
    rules: {
      '*.md': {
        loaders: ['raw-loader'],
        as: '*.js',
      },
    },
  },
  outputFileTracingIncludes: {
    '/api/docs-md/**/*': ['./public/markdown/docs/**/*'],
  },
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
      // Add a redirect to make the custom block for tanstack-db
      {
        source: '/r/tanstack-db-nextjs.json',
        destination: '/api/registry/tanstack-db',
        permanent: true,
      },
    ]
  },
}

export default nextConfig
