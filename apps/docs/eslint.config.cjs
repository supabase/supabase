const { defineConfig } = require('eslint/config')
const supabaseConfig = require('eslint-config-supabase/next')

module.exports = defineConfig([
  supabaseConfig,
  {
    // copies of standalone examples do not use the docs app theme
    files: ['examples/**/*.{js,jsx,ts,tsx}'],
    rules: {
      'shadcn/no-unknown-classes': 'off',
      'shadcn/no-arbitrary-values': 'off',
      'shadcn/no-raw-colors': 'off',
    },
  },
  {
    // cover mark has its own authored SVG palette
    files: ['components/DocsCoverLogo.tsx'],
    rules: { 'shadcn/no-raw-colors': 'off' },
  },
])
