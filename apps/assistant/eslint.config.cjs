const { defineConfig } = require('eslint/config')
const supabaseConfig = require('eslint-config-supabase/next')

module.exports = defineConfig([
  {
    ignores: ['supabase/workers/**/*.mjs', 'supabase/workers/**/*.mjs.map', 'node_modules/**'],
  },
  ...supabaseConfig,
  {
    files: ['supabase/workers/**/index.ts'],
    rules: {
      // Supabase Workers require `export default { fetch }`.
      'no-restricted-exports': 'off',
      'import/no-anonymous-default-export': 'off',
    },
  },
])
