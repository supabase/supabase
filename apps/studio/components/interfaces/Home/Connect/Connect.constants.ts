export type Parent = {
  key: string
  icon: string
  label: string
  files: File[]
  children: Parent[]
}

//export type File = { location: string; destinationFilename: string; label: string }
export type File = {
  location: string // location on the filesystem
  destinationFilename: string // where the user should put the file
  destinationLocation: string // label for the ui
}

export const CONNECTION_TYPES = [
  { key: 'frameworks', label: 'App Frameworks' },
  { key: 'orms', label: 'ORMs' },
]

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
                location: 'nextjs/app/supabasejs/env.local',
                destinationLocation: '.env.local',
                destinationFilename: '.env.local',
              },
              {
                // omit .tsx extension
                location: 'nextjs/app/supabasejs/page', // location on local disk
                destinationLocation: 'app/page.tsx', // label for the ui
                destinationFilename: 'page.tsx', // where the user should put the file
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
                location: 'app-postgresjs/env.local',
                destinationFilename: 'app-postgresjs.env.local',
                destinationLocation: 'app-postgresjs/.env.local',
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
                location: 'pages-supabasejs/env.local',
                destinationFilename: 'pages-supabasejs.env.local',
                destinationLocation: 'pages-supabasejs/.env.local',
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
                location: 'pages-postgresjs/env.local',
                destinationFilename: 'pages-postgresjs.env.local',
                destinationLocation: 'pages-postgresjs/.env.local',
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
        location: 'vue1/env.local',
        destinationFilename: 'vue1.env.local',
        destinationLocation: 'vue1/.env.local',
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
            location: 'svelte1/env.local',
            destinationFilename: 'svelte1.env.local',
            destinationLocation: 'svelte1/.env.local',
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
            location: 'svelte2/env.local',
            destinationFilename: 'svelte2.env.local',
            destinationLocation: 'svelte2/.env.local',
          },
        ],

        children: [],
      },
    ],
  },
] as const

export const ORMS: Parent[] = [
  {
    key: 'prisma',
    label: 'Prisma',
    icon: 'prisma',
    children: [],
    files: [
      {
        // omit .tsx extension
        location: 'prisma/env.local',
        destinationFilename: 'prisma.env.local',
        destinationLocation: 'prisma/.env.local',
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
        location: 'drizzle/env.local',
        destinationFilename: 'drizzle.env.local',
        destinationLocation: 'drizzle/.env.local',
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
        location: 'direct/env.local',
        destinationFilename: 'direct.env.local',
        destinationLocation: 'direct/.env.local',
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
        location: 'graphql/env.local',
        destinationFilename: 'graphql.env.local',
        destinationLocation: 'graphql/.env.local',
      },
    ],
  },
]
