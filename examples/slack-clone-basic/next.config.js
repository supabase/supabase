const path = require('path')

module.exports = {
  env: {
    SUPABASE_URL: process.env.SUPABASE_URL || 'http://localhost:8000',
    SUPABASE_KEY: process.env.SUPABASE_KEY || 'examplekey',
  },
  webpack(config) {
    config.resolve.alias['~'] = path.join(__dirname, '')
    return config
  },
}
