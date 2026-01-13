import { DOCS_URL } from 'lib/constants'
import { CodeBlockLang } from 'ui'

export type DatabaseConnectionType =
  | 'uri'
  | 'psql'
  | 'golang'
  | 'jdbc'
  | 'dotnet'
  | 'nodejs'
  | 'php'
  | 'python'
  | 'sqlalchemy'

export const DATABASE_CONNECTION_TYPES: {
  id: DatabaseConnectionType
  label: string
  contentType: 'input' | 'code'
  lang: CodeBlockLang
  fileTitle: string | undefined
}[] = [
  { id: 'uri', label: 'URI', contentType: 'input', lang: 'bash', fileTitle: undefined },
  { id: 'psql', label: 'PSQL', contentType: 'code', lang: 'bash', fileTitle: undefined },
  { id: 'golang', label: 'Golang', contentType: 'code', lang: 'go', fileTitle: '.env' },
  { id: 'jdbc', label: 'JDBC', contentType: 'input', lang: 'bash', fileTitle: undefined },
  {
    id: 'dotnet',
    label: '.NET',
    contentType: 'code',
    lang: 'csharp',
    fileTitle: 'appsettings.json',
  },
  { id: 'nodejs', label: 'Node.js', contentType: 'code', lang: 'js', fileTitle: '.env' },
  { id: 'php', label: 'PHP', contentType: 'code', lang: 'php', fileTitle: '.env' },
  { id: 'python', label: 'Python', contentType: 'code', lang: 'python', fileTitle: '.env' },
  { id: 'sqlalchemy', label: 'SQLAlchemy', contentType: 'code', lang: 'python', fileTitle: '.env' },
]

export const CONNECTION_PARAMETERS = {
  host: {
    key: 'host',
    description: 'The hostname of your database',
  },
  port: {
    key: 'port',
    description: 'Port number for the connection',
  },
  database: {
    key: 'database',
    description: 'Default database name',
  },
  user: {
    key: 'user',
    description: 'Database user',
  },
  pool_mode: {
    key: 'pool_mode',
    description: 'Connection pooling behavior',
  },
} as const

export type ConnectionType = {
  key: string
  icon: string
  label: string
  guideLink?: string
  children: ConnectionType[]
  files?: {
    name: string
    content: string
  }[]
}

export const FRAMEWORKS: ConnectionType[] = [
  {
    key: 'nextjs',
    label: 'Next.js',
    icon: 'nextjs',
    guideLink: `${DOCS_URL}/guides/getting-started/quickstarts/nextjs`,
    children: [
      {
        key: 'app',
        label: 'App Router',
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
        label: 'Pages Router',
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
    key: 'remix',
    label: 'Remix',
    icon: 'remix',
    guideLink: `${DOCS_URL}/guides/auth/server-side/creating-a-client?framework=remix&environment=remix-loader`,
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
    key: 'react',
    label: 'React',
    icon: 'react',
    guideLink: `${DOCS_URL}/guides/getting-started/quickstarts/reactjs`,
    children: [
      {
        key: 'create-react-app',
        label: 'Create React App',
        icon: 'react',
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
        key: 'vite',
        label: 'Vite',
        icon: 'vite',
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
    key: 'nuxt',
    label: 'Nuxt',
    icon: 'nuxt',
    guideLink: `${DOCS_URL}/guides/getting-started/quickstarts/nuxtjs`,
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
    guideLink: `${DOCS_URL}/guides/getting-started/quickstarts/vue`,
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
    guideLink: `${DOCS_URL}/guides/getting-started/quickstarts/sveltekit`,
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
    guideLink: `${DOCS_URL}/guides/getting-started/quickstarts/solidjs`,
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
    key: 'astro',
    label: 'Astro',
    icon: 'astro',
    guideLink: 'https://docs.astro.build/en/guides/backend/supabase/',
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
    label: 'Refine',
    icon: 'refine',
    guideLink: `${DOCS_URL}/guides/getting-started/quickstarts/refine`,
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
    key: 'tanstack',
    label: 'TanStack Start',
    icon: 'tanstack',
    guideLink: `${DOCS_URL}/guides/getting-started/quickstarts/tanstack`,
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
    key: 'flask',
    label: 'Flask (Python)',
    icon: 'python',
    guideLink: `${DOCS_URL}/guides/getting-started/quickstarts/flask`,
    children: [
      {
        key: 'supabasepy',
        label: 'supabase-py',
        children: [],
        icon: 'supabase',
      },
    ],
  },
]

export const MOBILES: ConnectionType[] = [
  {
    key: 'exporeactnative',
    label: 'Expo React Native',
    icon: 'expo',
    guideLink: `${DOCS_URL}/guides/getting-started/quickstarts/expo-react-native`,
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
    key: 'flutter',
    label: 'Flutter',
    icon: 'flutter',
    guideLink: `${DOCS_URL}/guides/getting-started/tutorials/with-flutter`,
    children: [
      {
        key: 'supabaseflutter',
        label: 'supabase-flutter',
        children: [],
        icon: 'supabase',
      },
    ],
  },
  {
    key: 'ionicreact',
    label: 'Ionic React',
    icon: 'react',
    guideLink: `${DOCS_URL}/guides/getting-started/tutorials/with-ionic-react`,
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
    key: 'swift',
    label: 'Swift',
    icon: 'swift',
    guideLink: `${DOCS_URL}/guides/getting-started/tutorials/with-swift`,
    children: [
      {
        key: 'supabaseswift',
        label: 'supabase-swift',
        children: [],
        icon: 'supabase',
      },
    ],
  },
  {
    key: 'androidkotlin',
    label: 'Android Kotlin',
    icon: 'kotlin',
    guideLink: `${DOCS_URL}/guides/getting-started/tutorials/with-kotlin`,
    children: [
      {
        key: 'supabasekt',
        label: 'supabase-kt',
        children: [],
        icon: 'supabase',
      },
    ],
  },
  {
    key: 'ionicangular',
    label: 'Ionic Angular',
    icon: 'ionic-angular',
    guideLink: `${DOCS_URL}/guides/getting-started/tutorials/with-ionic-angular`,
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
    guideLink: `${DOCS_URL}/guides/database/connecting-to-postgres#connecting-with-drizzle`,
    children: [],
  },
]

export const CONNECTION_TYPES = [
  { key: 'direct', label: 'Connection String', obj: [] },
  { key: 'frameworks', label: 'App Frameworks', obj: FRAMEWORKS },
  { key: 'mobiles', label: 'Mobile Frameworks', obj: MOBILES },
  { key: 'orms', label: 'ORMs', obj: ORMS },
  { key: 'mcp', label: 'MCP', obj: [] },
]

export const PGBOUNCER_ENABLED_BUT_NO_IPV4_ADDON_TEXT =
  'Purchase IPv4 add-on or use Shared Pooler if on a IPv4 network'
export const IPV4_ADDON_TEXT = 'Connections are IPv4 proxied with IPv4 add-on'

export type ConnectionStringMethod = 'direct' | 'transaction' | 'session'

export const connectionStringMethodOptions: Record<
  ConnectionStringMethod,
  { value: string; label: string; description: string }
> = {
  direct: {
    value: 'direct',
    label: 'Direct connection',
    description:
      'Ideal for applications with persistent and long-lived connections, such as those running on virtual machines or long-standing containers.',
  },
  transaction: {
    value: 'transaction',
    label: 'Transaction pooler',
    description:
      'Ideal for stateless applications like serverless functions where each interaction with Postgres is brief and isolated.',
  },
  session: {
    value: 'session',
    label: 'Session pooler',
    description:
      'Only recommended as an alternative to Direct Connection, when connecting via an IPv4 network.',
  },
}
