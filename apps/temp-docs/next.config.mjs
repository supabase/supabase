import nextMdx from '@next/mdx'

import remarkGfm from 'remark-gfm'
import rehypeSlug from 'rehype-slug'

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

export default withMDX(nextConfig)
