export type ConnectionType = {
  key: string
  icon: string
  label: string
  files: File[]
  children: ConnectionType[]
}

export type File = {
  location: string // location on the filesystem
  destinationFilename: string // where the user should put the file
  destinationLocation: string // label for the ui
}

export const FRAMEWORKS: ConnectionType[] = [
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
                location: 'nextjs/app/supabasejs/env.local', // location on local disk
                destinationLocation: '.env.local', // label for the ui
                destinationFilename: '.env.local', // where the user should put the file
              },
              {
                location: 'nextjs/app/supabasejs/page',
                destinationLocation: 'app/page.tsx',
                destinationFilename: 'page.tsx',
              },
              {
                location: 'nextjs/app/supabasejs/server',
                destinationLocation: 'utils/supabase/server.ts',
                destinationFilename: 'server.ts',
              },
              {
                location: 'nextjs/app/supabasejs/client',
                destinationLocation: 'utils/supabase/client.ts',
                destinationFilename: 'client.ts',
              },
              {
                location: 'nextjs/app/supabasejs/middleware',
                destinationLocation: 'utils/supabase/middleware.ts',
                destinationFilename: 'middleware.ts',
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
            label: 'Supabase-js',
            children: [],
            icon: 'supabase',
            files: [
              {
                // omit .tsx extension
                location: 'nextjs/pages/supabasejs/env.local', // location on local disk
                destinationLocation: '.env.local', // label for the ui
                destinationFilename: '.env.local', // where the user should put the file
              },
              {
                location: 'nextjs/pages/supabasejs/supabase',
                destinationLocation: 'utils/supabase.ts',
                destinationFilename: 'supabase.ts',
              },
              {
                location: 'nextjs/pages/supabasejs/app',
                destinationLocation: '_app.tsx',
                destinationFilename: '_app.tsx',
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
    key: 'react',
    label: 'React',
    icon: 'react',
    files: [
      {
        // omit .tsx extension
        location: 'react/env.local',
        destinationFilename: 'react.env.local',
        destinationLocation: 'react/.env.local',
      },
    ],
    children: [],
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
    key: 'solidjs',
    label: 'Solid.js',
    icon: 'solidjs',
    files: [
      {
        // omit .tsx extension
        location: 'solidjs/env.local',
        destinationFilename: 'solidjs.env.local',
        destinationLocation: 'solidjs/.env.local',
      },
    ],
    children: [],
  },
  {
    key: 'redwoodjs',
    label: 'RedwoodJS',
    icon: 'redwoodjs',
    children: [],
    files: [
      {
        // omit .tsx extension
        location: 'vue1/env.local',
        destinationFilename: 'vue1.env.local',
        destinationLocation: 'vue1/.env.local',
      },
    ],
  },
  {
    key: 'refine',
    label: 'refine',
    icon: 'refine',
    children: [],
    files: [
      {
        // omit .tsx extension
        location: 'refine/env.local',
        destinationFilename: 'refine.env.local',
        destinationLocation: 'refine/.env.local',
      },
    ],
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

export const ORMS: ConnectionType[] = [
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

export const GRAPHQL: ConnectionType[] = [
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

// move this to /tests/
// having duplicate keys will mess up the tabs and dropdowns
// check that each item has a unique top-level item
// example: frameworks need to be unique: next/react/vue/svelte/nuxt/etc
function checkParentsForDuplicates(item: ConnectionType[]) {
  const topLevelKeys = new Set()
  let hasDuplicates = false
  let duplicateKey = null

  item.forEach((item: ConnectionType, i: number) => {
    const key = item.key
    if (topLevelKeys.has(key)) {
      hasDuplicates = true
      duplicateKey = key
      console.error(`Duplicate keys found: ${duplicateKey}`)
    } else {
      topLevelKeys.add(key)
    }
  })

  if (hasDuplicates) {
    throw new Error(`Duplicate keys found. Each top-level item must be unique.`)
  }
}

export const CONNECTION_TYPES = [
  { key: 'frameworks', label: 'App Frameworks', obj: FRAMEWORKS },
  { key: 'orms', label: 'ORMs', obj: ORMS },
  { key: 'graphql', label: 'GraphQL', obj: GRAPHQL },
]

// Call the function with the GRAPHQL item
CONNECTION_TYPES.map((item) => item.obj).map((item) => checkParentsForDuplicates(item))
