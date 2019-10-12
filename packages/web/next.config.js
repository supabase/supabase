const withSass = require('@zeit/next-sass')
const withMDX = require('@zeit/next-mdx')({
  // parse mdx files
  extension: /\.mdx?$/,
  // options: {
  //     mdPlugins: [images, emoji]
  // }
})
module.exports = withSass(
  withMDX({
    experimental: { publicDirectory: true },
    exportPathMap: function() {
      return {
        '/': { page: '/' },
        '/blog': { page: '/blog' },
      }
    },
  })
)
