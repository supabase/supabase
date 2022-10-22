import nextMdx from '@next/mdx'
import bundleAnalyzer from '@next/bundle-analyzer'

import remarkGfm from 'remark-gfm'
import rehypeSlug from 'rehype-slug'

import withTM from 'next-transpile-modules'
import withPlugins from 'next-compose-plugins'

/**
 * Rewrites and redirects are handled by
 * apps/www nextjs config
 *
 * Do not add them in this config
 */

// /** @type {NextConfig} */
const nextConfig = {
  // Append the default value with md extensions
  pageExtensions: ['ts', 'tsx', 'js', 'jsx', 'md', 'mdx'],
  reactStrictMode: true,
  swcMinify: true,
}

const withBundleAnalyzer = bundleAnalyzer({ enabled: process.env.ANALYZE === 'true' })

const withMDX = nextMdx({
  extension: /\.mdx?$/,
  options: {
    remarkPlugins: [remarkGfm],
    rehypePlugins: [rehypeSlug],
    providerImportSource: '@mdx-js/react',
  },
})

export default withPlugins(
  [[withBundleAnalyzer({})], withMDX(), withTM(['ui', 'common'])],
  nextConfig
)
