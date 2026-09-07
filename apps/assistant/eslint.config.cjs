const { defineConfig } = require('eslint/config')
const supabaseConfig = require('eslint-config-supabase/node')

module.exports = defineConfig([
  {
    ignores: ['supabase/workers/**/*.mjs', 'supabase/workers/**/*.mjs.map', 'node_modules/**'],
  },
  ...supabaseConfig,
])
