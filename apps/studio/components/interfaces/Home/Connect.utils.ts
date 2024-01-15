export const LIBS = [
  {
    key: 'nextjs',
    label: 'Next.JS',
    variants: [
      { key: 'app', label: 'App Router' },
      { key: 'pages', label: 'Pages Router' },
    ],
    clients: [
      { key: 'supabasejs', label: 'supabase-js' },
      { key: 'postgresjs', label: 'Postgres.js' },
    ],
    // determines file display order
    files: ['env'],
  },
  {
    key: 'vue',
    label: 'Vue.js',
    variants: [
      { key: 'vue1', label: 'vue Router 1' },
      { key: 'vue2', label: 'vue Router 2' },
    ],
  },
  {
    key: 'angular',
    label: 'Angular',
  },
]

// not in use, just to organize and visualize
const mdxFiles = [
  'next/app/supabase-js',
  'next/app/postgres-js',
  'next/app/vercel-postgres',
  'next/pages/supabase-js',
  'next/pages/postgres-js',
  'next/pages/vercel-postgres',
  'vue/vue_router/supabase-js',
]
