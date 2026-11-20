const { defineConfig } = require('eslint/config')
const supabaseConfig = require('eslint-config-supabase/next')

module.exports = defineConfig([
  supabaseConfig,
  {
    files: ['registry/default/components/ui/**/*.{ts,tsx}'],
    rules: {
      'shadcn/no-arbitrary-values': 'off',
    },
  },
  {
    // registry example includes the supplied brand mark colors
    files: ['registry/default/platform/platform-kit-nextjs/components/logo-supabase.tsx'],
    rules: { 'shadcn/no-raw-colors': 'off' },
  },
])
