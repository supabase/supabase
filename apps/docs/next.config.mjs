// @ts-check
import nextMdx from '@next/mdx'
import remarkGfm from 'remark-gfm'
import rehypeSlug from 'rehype-slug'

//import theme from 'shiki/themes/nord.json' assert { type: 'json' }

import withTM from 'next-transpile-modules'
import withYaml from 'next-plugin-yaml'
import configureBundleAnalyzer from '@next/bundle-analyzer'

const withBundleAnalyzer = configureBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})

// import admonitions from 'remark-admonitions'

// import { remarkCodeHike } from '@code-hike/mdx'
// import codeHikeTheme from './codeHikeTheme.js'

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
      // [
      //   remarkCodeHike,
      //   {
      //     theme: codeHikeTheme,
      //     autoImport: false,
      //     lineNumbers: true,
      //     showCopyButton: true,
      //   },
      // ],
      remarkGfm,
    ],
    rehypePlugins: [rehypeSlug],
    // This is required for `MDXProvider` component
    // providerImportSource: '@mdx-js/react',
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
      'user-images.githubusercontent.com',
      'raw.githubusercontent.com',
      'weweb-changelog.ghost.io',
      'img.youtube.com',
      'archbee-image-uploads.s3.amazonaws.com',
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
    withTM(['ui', 'common', '@supabase/auth-helpers-nextjs', 'mermaid', 'mdx-mermaid', 'dayjs']),
    withMDX,
    withYaml,
    withBundleAnalyzer,
  ]
  return plugins.reduce((acc, next) => next(acc), nextConfig)
}

export default configExport
