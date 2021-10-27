const withMDX = require('@next/mdx')()

module.exports = withMDX({
  basePath: '',
  pageExtensions: ['js', 'jsx', 'tsx', 'md', 'mdx'],
})
