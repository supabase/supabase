export type Parent = {
  key: string
  icon: string
  label: string
  files: File[]
  children: Parent[]
}

export type File = { path: string; name: string; displayPath: string }

export const FRAMEWORKS: Parent[] = [
  {
    key: 'nextjs',
    label: 'Next.JS',
    icon: 'nextjs',
    files: [],
    children: [
      {
        key: 'app',
        label: 'App router',
        icon: '',
        files: [],
        children: [
          {
            key: 'supabasejs',
            label: 'supabase-js',
            icon: 'supabase',
            children: [],
            files: [
              {
                // omit .tsx extension
                path: 'app-supabasejs/env.local',
                name: 'app-supabasejs.env.local',
                displayPath: 'app-supabasejs/.env.local',
              },
            ],
          },
          {
            key: 'postgresjs',
            label: 'Postgres.js',
            icon: 'postgres',
            children: [],
            files: [
              {
                // omit .tsx extension
                path: 'app-postgresjs/env.local',
                name: 'app-postgresjs.env.local',
                displayPath: 'app-postgresjs/.env.local',
              },
            ],
          },
        ],
      },
      {
        key: 'pages',
        label: 'Pages router',
        icon: '',
        files: [],
        children: [
          {
            key: 'supabasejs',
            label: 'pages Supabase-js',
            children: [],
            icon: 'supabase',
            files: [
              {
                // omit .tsx extension
                path: 'pages-supabasejs/env.local',
                name: 'pages-supabasejs.env.local',
                displayPath: 'pages-supabasejs/.env.local',
              },
            ],
          },
          {
            key: 'postgresjs',
            label: 'pages Postgres.js',
            icon: 'postgres',
            children: [],
            files: [
              {
                // omit .tsx extension
                path: 'pages-postgresjs/env.local',
                name: 'pages-postgresjs.env.local',
                displayPath: 'pages-postgresjs/.env.local',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    key: 'vuejs',
    label: 'Vue.JS',
    icon: 'vuejs',
    files: [
      {
        // omit .tsx extension
        path: 'vue1/env.local',
        name: 'vue1.env.local',
        displayPath: 'vue1/.env.local',
      },
    ],
    children: [],
  },
  {
    key: 'svelte',
    label: 'Svelte.JS',
    icon: 'svelte',
    files: [],
    children: [
      {
        key: 'svelterouter',
        label: 'Svelte router',
        icon: 'svelte',
        files: [
          {
            // omit .tsx extension
            path: 'svelte1/env.local',
            name: 'svelte1.env.local',
            displayPath: 'svelte1/.env.local',
          },
        ],
        children: [],
      },
      {
        key: 'svelterouter2',
        label: 'Svelte router2',
        icon: 'svelte',
        files: [
          {
            // omit .tsx extension
            path: 'svelte2/env.local',
            name: 'svelte2.env.local',
            displayPath: 'svelte2/.env.local',
          },
        ],

        children: [],
      },
    ],
  },
]

export const ORMS: Parent[] = [
  {
    key: 'prisma',
    label: 'Prisma',
    icon: 'prisma',
    children: [],
    files: [
      {
        // omit .tsx extension
        path: 'prisma/env.local',
        name: 'prisma.env.local',
        displayPath: 'prisma/.env.local',
      },
    ],
  },
  {
    key: 'drizzle',
    label: 'Drizzle',
    icon: 'drizzle',
    children: [],
    files: [
      {
        // omit .tsx extension
        path: 'drizzle/env.local',
        name: 'drizzle.env.local',
        displayPath: 'drizzle/.env.local',
      },
    ],
  },
]

export const DIRECT: Parent[] = [
  {
    key: 'direct',
    label: 'Direct',
    icon: '',
    children: [],
    files: [
      {
        // omit .tsx extension
        path: 'direct/env.local',
        name: 'direct.env.local',
        displayPath: 'direct/.env.local',
      },
    ],
  },
]
export const GRAPHQL: Parent[] = [
  {
    key: 'graphql',
    label: 'GraphQL',
    icon: 'graphql',
    children: [],
    files: [
      {
        // omit .tsx extension
        path: 'graphql/env.local',
        name: 'graphql.env.local',
        displayPath: 'graphql/.env.local',
      },
    ],
  },
]
