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
    // a transition-[...] list names css properties, not a design value, so no token can replace it
    'shadcn/no-arbitrary-values': ['warn', { allow: ['layout', 'transition'] }],
    'shadcn/no-raw-colors': 'warn',
  },
}
