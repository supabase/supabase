import nextMdx from '@next/mdx'

import remarkGfm from 'remark-gfm'
import rehypeSlug from 'rehype-slug'

import withTM from 'next-transpile-modules'

const withMDX = nextMdx({
  extension: /\.mdx?$/,
  options: {
    remarkPlugins: [remarkGfm],
    rehypePlugins: [rehypeSlug],
  },
})

const nextConfig = {
  basePath: '',
  pageExtensions: ['js', 'jsx', 'ts', 'tsx', 'md', 'mdx'],
  trailingSlash: false,
  reactStrictMode: true,
  images: {
    domains: ['avatars.githubusercontent.com', 'supabase.com'],
  },
}

// next.config.js.
export default () => {
  const plugins = [withMDX, withTM(['ui', 'common'])]
  return plugins.reduce((acc, next) => next(acc), nextConfig)
}
