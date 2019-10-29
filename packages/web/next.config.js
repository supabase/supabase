const withPlugins = require('next-compose-plugins')

// Next Config
const nextConfig = {
  experimental: { publicDirectory: true },
}

// CSS
const withCSS = require('@zeit/next-css')
const withCssConfig = {}

// SASS
const withSass = require('@zeit/next-sass')
const withSassConfig = {
  sassLoaderOptions: {
    includePaths: ['./', 'absolute/path/b'],
  },
}

// Markdown
const rehypePrism = require('@mapbox/rehype-prism')
const withMDX = require('@zeit/next-mdx')({
  extension: /\.(md|mdx)?$/,
  options: {
    hastPlugins: [rehypePrism],
  },
})
const withMdxConfig = {}

module.exports = withPlugins(
  [[withCSS, withCssConfig], [withSass, withSassConfig], [withMDX, withMdxConfig]],
  nextConfig
)
