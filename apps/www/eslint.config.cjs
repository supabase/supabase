const { defineConfig } = require('eslint/config')
const supabaseConfig = require('eslint-config-supabase/next')

module.exports = defineConfig([
  supabaseConfig,
  {
    files: ['**/*.{js,jsx,mjs,ts,tsx,mts,cts}'],
    rules: {
      'react-hooks/rules-of-hooks': 'warn',
      'react/no-unescaped-entities': 'warn',
      'react/display-name': 'warn',
      'react/no-children-prop': 'warn',
    },
  },
])
