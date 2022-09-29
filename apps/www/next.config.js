// const gfm = require('remark-gfm')
// const slug = require('rehype-slug')
// const withMDX = require('@next/mdx')({
//   extension: /\.mdx?$/,
//   options: {
//     remarkPlugins: [gfm],
//     rehypePlugins: [slug],
//     // If you use `MDXProvider`, uncomment the following line.
//     providerImportSource: '@mdx-js/react',
//   },
// })

const rewrites = require('./rewrites')
const redirects = require('./redirects')

module.exports = {
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
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
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
    return [...rewrites]
  },
  async redirects() {
    return [...redirects]
  },
}
// )

// Export all config
// const moduleExports = withPlugins([withTM()], nextConfig)
// module.exports = moduleExports
