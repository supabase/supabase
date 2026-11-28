const { defineConfig } = require('eslint/config')
const supabaseConfig = require('eslint-config-supabase/next')

module.exports = defineConfig([
  { ignores: ['.output/**', '.vercel/**', '.nitro/**', 'src/routeTree.gen.ts'] },
  supabaseConfig,
  {
    // TanStack Start app, not Next.js.
    rules: {
      '@next/next/no-img-element': 'off',
      '@next/next/no-head-element': 'off',
    },
  },
  {
    // The generated placeholder UI is sized in em so it scales with its container.
    files: ['src/components/MockApp.tsx'],
    rules: { 'shadcn/no-arbitrary-values': 'off' },
  },
])
