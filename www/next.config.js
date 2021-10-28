const withMDX = require('@next/mdx')()

module.exports = withMDX({
  basePath: '',
  pageExtensions: ['js', 'jsx', 'tsx', 'md', 'mdx'],
  async rewrites() {
    return [
      {
        source: '/:path*',
        destination: `/:path*`,
      },
      {
        source: '/docs',
        destination: `${process.env.NEXT_PUBLIC_DOCS_URL}/docs`,
      },
      {
        source: '/docs/:path*',
        destination: `${process.env.NEXT_PUBLIC_DOCS_URL}/docs/:path*`,
      },
    ]
  },
})
