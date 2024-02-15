export type ConnectionType = {
  key: string
  icon: string
  label: string
  guideLink?: string
  children: ConnectionType[]
}

export const FRAMEWORKS: ConnectionType[] = [
  {
    key: 'nextjs',
    label: 'Next.JS',
    icon: 'nextjs',
    guideLink: 'https://supabase.com/docs/guides/getting-started/quickstarts/nextjs',
    children: [
      {
        key: 'app',
        label: 'App router',
        icon: '',
        children: [
          {
            key: 'supabasejs',
            label: 'supabase-js',
            icon: 'supabase',
            children: [],
          },
        ],
      },
      {
        key: 'pages',
        label: 'Pages router',
        icon: '',
        children: [
          {
            key: 'supabasejs',
            label: 'Supabase-js',
            children: [],
            icon: 'supabase',
          },
        ],
      },
    ],
  },
  {
    key: 'react',
    label: 'React',
    icon: 'react',
    guideLink: 'https://supabase.com/docs/guides/getting-started/quickstarts/reactjs',
    children: [
      {
        key: 'supabasejs',
        label: 'Supabase-js',
        children: [],
        icon: 'supabase',
      },
    ],
  },
  {
    key: 'nuxt',
    label: 'Nuxt',
    icon: 'nuxt',
    guideLink: 'https://supabase.com/docs/guides/getting-started/quickstarts/nuxtjs',
    children: [
      {
        key: 'supabasejs',
        label: 'Supabase-js',
        children: [],
        icon: 'supabase',
      },
    ],
  },
  {
    key: 'vuejs',
    label: 'Vue.JS',
    icon: 'vuejs',
    guideLink: 'https://supabase.com/docs/guides/getting-started/quickstarts/vue',
    children: [
      {
        key: 'supabasejs',
        label: 'Supabase-js',
        children: [],
        icon: 'supabase',
      },
    ],
  },

  {
    key: 'sveltekit',
    label: 'SvelteKit',
    icon: 'sveltekit',
    guideLink: 'https://supabase.com/docs/guides/getting-started/quickstarts/sveltekit',
    children: [
      {
        key: 'supabasejs',
        label: 'Supabase-js',
        children: [],
        icon: 'supabase',
      },
    ],
  },
  {
    key: 'solidjs',
    label: 'Solid.js',
    icon: 'solidjs',
    guideLink: 'https://supabase.com/docs/guides/getting-started/quickstarts/solidjs',
    children: [
      {
        key: 'supabasejs',
        label: 'Supabase-js',
        children: [],
        icon: 'supabase',
      },
    ],
  },
  {
    key: 'refine',
    label: 'refine',
    icon: 'refine',
    guideLink: 'https://supabase.com/docs/guides/getting-started/quickstarts/refine',
    children: [
      {
        key: 'supabasejs',
        label: 'Supabase-js',
        children: [],
        icon: 'supabase',
      },
    ],
  },
]

export const ORMS: ConnectionType[] = [
  {
    key: 'prisma',
    label: 'Prisma',
    icon: 'prisma',
    guideLink: 'https://supabase.com/partners/integrations/prisma',
    children: [],
  },
  {
    key: 'drizzle',
    label: 'Drizzle',
    icon: 'drizzle',
    guideLink:
      'https://supabase.com/docs/guides/database/connecting-to-postgres#connecting-with-drizzle',
    children: [],
  },
]

export const CONNECTION_TYPES = [
  { key: 'frameworks', label: 'App Frameworks', obj: FRAMEWORKS },
  { key: 'orms', label: 'ORMs', obj: ORMS },
]
