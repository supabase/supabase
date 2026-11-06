const { defineConfig } = require('eslint/config')
const supabaseConfig = require('eslint-config-supabase/next')

module.exports = defineConfig([
  supabaseConfig,
  { ignores: ['__registry__'] },
  {
    files: ['registry/**/*.tsx', 'app/**/*.tsx'],
    rules: {
      'no-restricted-exports': 'off',
    },
  },
])
