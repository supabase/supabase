const { plugin: shadcn } = require('@shadcn/lint')

module.exports = {
  name: 'supabase/shadcn',
  files: ['**/*.{js,jsx,mjs,ts,tsx,mts,cts}'],
  plugins: { shadcn },
  settings: {
    shadcn: {
      componentImports: ['^ui(/|$)', '^ui-patterns(/|$)'],
    },
  },
  rules: {
    'shadcn/no-unknown-classes': ['warn', { allow: ['not-prose'] }],
    'shadcn/no-arbitrary-values': ['warn', { allow: ['layout'] }],
    'shadcn/no-raw-colors': 'warn',
  },
}
