export const FRAMEWORKS = [
  {
    key: 'nextjs',
    label: 'Next.JS',
    files: [],
    parentKey: null,
    grandparentKey: null,
  },
  {
    key: 'app',
    label: 'App router',
    files: [],
    parentKey: 'nextjs',
    grandparentKey: null,
  },
  {
    key: 'supabasejs',
    label: 'Supabase-js',
    parentKey: 'nextjs',
    grandparentKey: 'app',
    files: [
      {
        // omit .tsx extension
        path: 'nextjs/supabase-js/env.local',
        name: '.env.local',
        displayPath: '/.env.local',
      },
      {
        // omit .tsx extension
        path: 'nextjs/supabase-js/client',
        name: 'client.tsx',
        displayPath: '/utils/supabase/client.tsx',
      },
    ],
  },
  {
    key: 'vue',
    label: 'Vue.JS',
    parentKey: null,
    grandparentKey: null,
    files: [],
  },
  {
    key: 'supabasejs',
    label: 'Supabase-js',
    parentKey: 'vue',
    grandparentKey: null,
    files: [
      {
        // omit .tsx extension
        path: 'vue/supabase-js/env.local',
        name: '.env.local',
        displayPath: '/.env.local',
      },
      {
        // omit .tsx extension
        path: 'vue/supabase-js/client',
        name: 'client.tsx',
        displayPath: '/utils/supabase/client.tsx',
      },
    ],
  },
]

export const ORMS = [
  {
    key: 'prisma',
    label: 'Prisma',
    parentKey: null,
    grandparentKey: null,
    files: [
      {
        // omit .tsx extension
        path: 'prisma/env.local',
        name: '.env.local',
        displayPath: '/.env.local',
      },
    ],
  },
  {
    key: 'drizzle',
    label: 'Drizzle',
    parentKey: null,
    grandparentKey: null,
    files: [
      {
        // omit .tsx extension
        path: 'drizzle/env.local',
        name: '.env.local',
        displayPath: '/.env.local',
      },
    ],
  },
]

export const DIRECT = [
  {
    key: 'psql',
    label: 'Psql',
    parentKey: null,
    grandparentKey: null,
    files: [
      {
        // omit .tsx extension
        path: 'psql/env.local',
        name: '.env.local',
        displayPath: '/.env.local',
      },
    ],
  },
  {
    key: 'php',
    label: 'PHP',
    parentKey: null,
    grandparentKey: null,
    files: [
      {
        // omit .tsx extension
        path: 'php/env.local',
        name: '.env.local',
        displayPath: '/.env.local',
      },
    ],
  },
]

export const GRAPHQL = [
  {
    key: 'graphql',
    label: 'GraphQL',
    parentKey: null,
    grandparentKey: null,
    files: [
      {
        // omit .tsx extension
        path: 'graphql/env.local',
        name: '.env.local',
        displayPath: '/.env.local',
      },
    ],
  },
]
