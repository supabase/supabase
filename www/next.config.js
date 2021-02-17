const withMDX = require('@next/mdx')({
  extension: /\.mdx?$/,
})

module.exports = {
  basePath: '/new',
  pageExtensions: ['js', 'jsx', 'tsx', 'md', 'mdx'],
}
