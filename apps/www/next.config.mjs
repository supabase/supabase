import bundleAnalyzer from '@next/bundle-analyzer'
import nextMdx from '@next/mdx'

import remarkGfm from 'remark-gfm'
import rehypeSlug from 'rehype-slug'

import rewrites from './lib/rewrites.js'
import redirects from './lib/redirects.js'

import { remarkCodeHike } from '@code-hike/mdx'
import codeHikeTheme from 'config/code-hike.theme.json' assert { type: 'json' }

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
  transpilePackages: ['ui', 'ui-patterns', 'common', 'shared-data', 'icons'],
  images: {
    dangerouslyAllowSVG: true,
    domains: [
      'api.producthunt.com',
      'avatars.githubusercontent.com',
      'ca.slack-edge.com',
      'colab.research.google.com',
      'github.com',
      'https://s3-us-west-2.amazonaws.com',
      'images.unsplash.com',
      'img.youtube.com',
      'vercel.com',
      'obuldanrptloktxcffvn.supabase.co',
      'pbs.twimg.com',
      'res.cloudinary.com',
      's3-us-west-2.amazonaws.com',
      'supabase.com',
      'user-images.githubusercontent.com',
    ],
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
    ]
  },
  async rewrites() {
    return rewrites
  },
  async redirects() {
    return redirects
  },
}

// next.config.js.
export default () => {
  const plugins = [withMDX, withBundleAnalyzer]
  return plugins.reduce((acc, next) => next(acc), nextConfig)
}
