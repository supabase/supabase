const withPlugins = require('next-compose-plugins')

// Next Config
const nextConfig = {
  experimental: { publicDirectory: true }
}

// SASS
const withSass = require('@zeit/next-sass')
const withSassConfig = {
  sassLoaderOptions: {
    includePaths: ['./', 'absolute/path/b'],
  },
}

// Markdown
const withMDX = require('@zeit/next-mdx')({
  extension: /\.mdx?$/,
})
const withMdxConfig = { }

module.exports = withPlugins([[withSass, withSassConfig], [withMDX, withMdxConfig]], nextConfig)
