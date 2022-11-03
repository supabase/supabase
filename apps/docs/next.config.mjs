import nextMdx from '@next/mdx'
import bundleAnalyzer from '@next/bundle-analyzer'

import remarkGfm from 'remark-gfm'
import admonitions from 'remark-admonitions'
import rehypeSlug from 'rehype-slug'

import withTM from 'next-transpile-modules'

// import { remarkCodeHike } from '@code-hike/mdx'
// import theme from 'shiki/themes/dark-plus.json' assert { type: 'json' }
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
      //   { theme: codeHikeTheme, autoImport: false },
      // ],
      remarkGfm,
      [admonitions, {}],
    ],
    rehypePlugins: [rehypeSlug],
    // This is required for `MDXProvider` component
    providerImportSource: '@mdx-js/react',
  },
})

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})

// /** @type {NextConfig} */
const nextConfig = {
  // Append the default value with md extensions
  pageExtensions: ['ts', 'tsx', 'js', 'jsx', 'md', 'mdx'],
  reactStrictMode: true,
  swcMinify: true,
  basePath: '/new-docs',
}

// next.config.js
export default () => {
  const plugins = [withMDX, withTM(['ui', 'common'])]
  return plugins.reduce((acc, next) => next(acc), nextConfig)
}
