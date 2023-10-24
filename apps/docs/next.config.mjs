// @ts-check
import nextMdx from '@next/mdx'
import remarkGfm from 'remark-gfm'
import rehypeSlug from 'rehype-slug'
import { remarkCodeHike } from '@code-hike/mdx'

import withTM from 'next-transpile-modules'
import withYaml from 'next-plugin-yaml'
import configureBundleAnalyzer from '@next/bundle-analyzer'

import codeHikeTheme from 'config/code-hike.theme.json' assert { type: 'json' }

const withBundleAnalyzer = configureBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})

/**
 * Rewrites and redirects are handled by
 * apps/www nextjs config
 *
 * Do not add them in this config
 */

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
    providerImportSource: '@mdx-js/react',
  },
})

/** @type {import('next').NextConfig} nextConfig */
const nextConfig = {
  // Append the default value with md extensions
  pageExtensions: ['ts', 'tsx', 'js', 'jsx', 'md', 'mdx'],
  // reactStrictMode: true,
  // swcMinify: true,
  basePath: '/docs',
  images: {
    dangerouslyAllowSVG: true,
    domains: [
      'avatars.githubusercontent.com',
      'github.com',
      'supabase.github.io',
      'user-images.githubusercontent.com',
      'raw.githubusercontent.com',
      'weweb-changelog.ghost.io',
      'img.youtube.com',
      'archbee-image-uploads.s3.amazonaws.com',
      'obuldanrptloktxcffvn.supabase.co',
    ],
  },
  experimental: {
    // TODO: @next/mdx ^13.0.2 only supports experimental mdxRs flag. next ^13.0.2 will stop warning about this being unsupported.
    // mdxRs: true,
    modularizeImports: {
      lodash: {
        transform: 'lodash/{{member}}',
      },
    },
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
  async redirects() {
    return [
      {
        source: '/',
        destination: '/docs',
        basePath: false,
        permanent: false,
      },
    ]
  },
}

const configExport = () => {
  const plugins = [
    withTM(['ui', 'common', 'mermaid', 'mdx-mermaid', 'dayjs', 'shared-data']),
    withMDX,
    withYaml,
    withBundleAnalyzer,
  ]
  return plugins.reduce((acc, next) => next(acc), nextConfig)
}

export default configExport
