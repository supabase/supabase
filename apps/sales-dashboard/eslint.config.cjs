const { defineConfig } = require('eslint/config')
const supabaseConfig = require('eslint-config-supabase/next')

module.exports = defineConfig([
  supabaseConfig,
  {
    files: ['next.config.mjs'],
    rules: {
      'no-restricted-exports': 'off',
    },
  },
])
