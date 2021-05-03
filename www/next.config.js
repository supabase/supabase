const withMDX = require('@next/mdx')()

module.exports = withMDX({
  basePath: '/new',
  pageExtensions: ['js', 'jsx', 'tsx', 'md', 'mdx'],
})
