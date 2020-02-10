const withSass = require('@zeit/next-sass')
module.exports = withSass({
  env: {
    SUPABASE_URL: 'http://localhost:8000',
    SUPABASE_KEY: 'examplekey',
  },
})
