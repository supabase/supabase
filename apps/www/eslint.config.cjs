const { defineConfig } = require('eslint/config')
const supabaseConfig = require('eslint-config-supabase/next')

const noCrossZoneLink = require('./eslint-rules/no-cross-zone-link.cjs')

module.exports = defineConfig([
  supabaseConfig,
  {
    files: [
      'components/Products/VectorAI/PGvectorImg.tsx',
      'components/Products/VectorAI/CustomersVisual.tsx',
    ],
    rules: { 'shadcn/no-raw-colors': 'off' },
  },
  {
    files: ['**/*.{js,jsx,mjs,ts,tsx,mts,cts}'],
    rules: {
      'react-hooks/rules-of-hooks': 'warn',
      'react/no-unescaped-entities': 'warn',
      'react/display-name': 'warn',
      'react/no-children-prop': 'warn',
    },
  },
  {
    files: ['**/*.{jsx,tsx}'],
    plugins: { www: { rules: { 'no-cross-zone-link': noCrossZoneLink } } },
    rules: { 'www/no-cross-zone-link': 'error' },
  },
])
