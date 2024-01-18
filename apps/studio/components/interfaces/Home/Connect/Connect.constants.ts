export type Parent = {
  key: string
  label: string
  files: string[]
  children: Parent[]
}

export const ORMS: Parent[] = [
  {
    key: 'prisma',
    label: 'Prisma',
    files: ['prisma-env.local', 'prisma-server.tsx'],
    children: [],
  },
]

export const FRAMEWORKS: Parent[] = [
  {
    key: 'nextjs',
    label: 'Next.JS',
    files: [],
    children: [
      {
        key: 'app',
        label: 'App router',
        files: [],
        children: [
          {
            key: 'supabasejs',
            label: 'Supabase-js',
            children: [],
            files: ['app-sb-js-env.local', 'app-sb-js-server.tsx'],
          },
          {
            key: 'postgresjs',
            label: 'Postgres.js',
            children: [],
            files: ['app-pg-env.local', 'app-pg-page.tsx'],
          },
        ],
      },
      {
        key: 'pages',
        label: 'Pages router',
        files: [],
        children: [
          {
            key: 'supabasejs',
            label: 'pages Supabase-js',
            children: [],
            files: ['pages-supabase-js-env.local', 'pages-supabase-js-app.tsx'],
          },
          {
            key: 'postgresjs',
            label: 'pages Postgres.js',
            children: [],
            files: ['pages-postgres-js-env.local', 'pages-postgres-js-app.tsx'],
          },
        ],
      },
    ],
  },
  {
    key: 'vue',
    label: 'Vue.JS',
    files: ['vue-env.local', 'vue-server.tsx'],
    children: [],
  },
  {
    key: 'svelte',
    label: 'Svelte.JS',
    files: [],
    children: [
      {
        key: 'svelterouter',
        label: 'Svelte router',
        files: ['svelte1-env.local', 'svelterouter1-app.tsx'],
        children: [],
      },
      {
        key: 'svelterouter2',
        label: 'Svelte router2',
        files: ['svelte2-env.local', 'svelte2-server.tsx'],
        children: [],
      },
    ],
  },
]
