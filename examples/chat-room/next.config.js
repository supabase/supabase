const withPlugins = require('next-compose-plugins')

// Next Config
const nextConfig = {
  env: {
    SUPABASE_URL: 'http://localhost:8000',
    SUPABASE_KEY: 'examplekey',
  },
  webpack(config, options) {
    config.resolve.alias['~'] = path.join(__dirname, '')
    return config
  },
}


// SASS
const withSass = require('@zeit/next-sass')
const withSassConfig = {
  sassLoaderOptions: {
    includePaths: ['./', 'absolute/path/b'],
  },
}

// Export all config
module.exports = withPlugins([[withSass, withSassConfig]], nextConfig)