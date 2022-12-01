import bundleAnalyzer from '@next/bundle-analyzer'
import nextMdx from '@next/mdx'

import remarkGfm from 'remark-gfm'
import rehypeSlug from 'rehype-slug'

import rewrites from './lib/rewrites.js'
import redirects from './lib/redirects.js'

import withTM from 'next-transpile-modules'

const withMDX = nextMdx({
  extension: /\.mdx?$/,
  options: {
    remarkPlugins: [remarkGfm],
    rehypePlugins: [rehypeSlug],
    // This is required for `MDXProvider` component
    providerImportSource: '@mdx-js/react',
  },
})

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})

const nextConfig = {
  basePath: '',
  pageExtensions: ['js', 'jsx', 'ts', 'tsx', 'md', 'mdx'],
  trailingSlash: false,
  images: {
    dangerouslyAllowSVG: true,
    domains: [
      'avatars.githubusercontent.com',
      'github.com',
      'ca.slack-edge.com',
      'res.cloudinary.com',
      'images.unsplash.com',
      'supabase.com',
      'obuldanrptloktxcffvn.supabase.co',
      'avatars.githubusercontent.com',
      'colab.research.google.com',
      'api.producthunt.com',
      'https://s3-us-west-2.amazonaws.com',
      's3-us-west-2.amazonaws.com',
      'user-images.githubusercontent.com',
      'pbs.twimg.com',
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
  const plugins = [withMDX, withBundleAnalyzer, withTM(['ui', 'common'])]
  return plugins.reduce((acc, next) => next(acc), nextConfig)
}
