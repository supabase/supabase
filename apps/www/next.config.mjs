import bundleAnalyzer from '@next/bundle-analyzer'
import nextMdx from '@next/mdx'

import rehypeSlug from 'rehype-slug'
import remarkGfm from 'remark-gfm'

import redirects from './lib/redirects.js'
import remotePatterns from './lib/remotePatterns.js'
import rewrites from './lib/rewrites.js'

import { remarkCodeHike } from '@code-hike/mdx'
import codeHikeTheme from 'config/code-hike.theme.json' assert { type: 'json' }

import { withContentlayer } from 'next-contentlayer2'

const withMDX = nextMdx({
  extension: /\.mdx?$/,
  options: {
    remarkPlugins: [
      [
        remarkCodeHike,
        {
          theme: codeHikeTheme,
          lineNumbers: true,
          showCopyButton: true,
        },
      ],
      remarkGfm,
    ],
    rehypePlugins: [rehypeSlug],
    // This is required for `MDXProvider` component
    providerImportSource: '@mdx-js/react',
  },
})

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})

/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  basePath: '',
  pageExtensions: ['js', 'jsx', 'ts', 'tsx', 'md', 'mdx'],
  trailingSlash: false,
  transpilePackages: ['ui', 'ui-patterns', 'common', 'shared-data', 'icons', 'api-types'],
  reactStrictMode: true,
  swcMinify: true,
  images: {
    dangerouslyAllowSVG: true,
    remotePatterns,
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: '',
          },
          {
            key: 'X-Robots-Tag',
            value: 'all',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
        ],
      },
      {
        source: '/.well-known/vercel/flags',
        headers: [
          {
            key: 'content-type',
            value: 'application/json',
          },
        ],
      },
    ]
  },
  async rewrites() {
    return rewrites
  },
  async redirects() {
    return redirects
  },
  typescript: {
    // WARNING: production builds can successfully complete even there are type errors
    // Typechecking is checked separately via .github/workflows/typecheck.yml
    ignoreBuildErrors: true,
  },
  eslint: {
    // We are already running linting via GH action, this will skip linting during production build on Vercel.
    ignoreDuringBuilds: true,
  },
}

// next.config.js.
export default () => {
  const plugins = [withContentlayer, withMDX, withBundleAnalyzer]
  return plugins.reduce((acc, next) => next(acc), nextConfig)
}
