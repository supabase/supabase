const { defineConfig } = require('eslint/config')
const supabaseConfig = require('eslint-config-supabase/next')

module.exports = defineConfig([
  supabaseConfig,
  {
    files: ['registry/**/*.tsx', '__registry__/**/*.tsx', 'app/**/*.tsx'],
    rules: {
      'no-restricted-exports': 'off',
    },
  },
])
