import { IS_DEV } from '~/lib/constants'
import type { GlobalMenuItems, NavMenuConstant, References } from '../Navigation.types'

export const GLOBAL_MENU_ITEMS: GlobalMenuItems = [
  [
    {
      label: 'Start',
      icon: 'getting-started',
      href: '/guides/getting-started',
      level: 'gettingstarted',
    },
  ],
  [
    {
      label: 'Products',
      menuItems: [
        [
          {
            label: 'Database',
            icon: 'database',
            href: '/guides/database/overview',
            level: 'database',
          },
          {
            label: 'Auth',
            icon: 'auth',
            href: '/guides/auth',
            level: 'auth',
          },
          {
            label: 'Storage',
            icon: 'storage',
            href: '/guides/storage',
            level: 'storage',
          },
          {
            label: 'Edge Functions',
            icon: 'edge-functions',
            href: '/guides/functions',
            level: 'functions',
          },
          {
            label: 'Realtime',
            icon: 'realtime',
            href: '/guides/realtime',
            level: 'realtime',
          },
          {
            label: 'AI & Vectors',
            icon: 'ai',
            href: '/guides/ai',
            level: 'ai',
          },
        ],
      ],
    },
  ],
  [
    {
      label: 'Build',
      menuItems: [
        [
          {
            label: 'Local Dev / CLI',
            icon: 'dev-cli',
            href: '/guides/cli',
            level: 'reference_javascript',
          },
          {
            label: 'Platform',
            icon: 'platform',
            href: '/guides/platform',
            level: 'platform',
          },
          {
            label: 'Self-Hosting',
            icon: 'self-hosting',
            href: '/guides/self-hosting',
            level: 'self_hosting',
          },
          {
            label: 'Integrations',
            icon: 'integrations',
            hasLightIcon: true,
            href: 'https://supabase.com/partners/integrations',
            level: 'integrations',
          },
        ],
      ],
    },
  ],
  [
    {
      label: 'Reference',
      menuItems: [
        [
          {
            label: 'Client Library Reference',
          },
          {
            label: 'JavaScript',
            icon: 'reference-javascript',
            href: '/reference/javascript/introduction',
            level: 'reference_javascript',
          },
          {
            label: 'Flutter',
            icon: 'reference-dart',
            href: '/reference/dart/introduction',
            level: 'reference_dart',
          },
          {
            label: 'Swift',
            icon: 'reference-swift',
            href: '/reference/swift/introduction',
            level: 'reference_swift',
          },
          {
            label: 'Python',
            icon: 'reference-python',
            href: '/reference/python/introduction',
            level: 'reference_python',
          },
          {
            label: 'C#',
            icon: 'reference-csharp',
            href: '/reference/csharp/introduction',
            level: 'reference_csharp',
            community: true,
          },
          {
            label: 'Kotlin',
            icon: 'reference-kotlin',
            href: '/reference/kotlin/introduction',
            level: 'reference_kotlin',
            community: true,
          },
        ],
        [
          {
            label: 'CLI Commands',
            icon: 'reference-cli',
            href: '/reference/cli/introduction',
            level: 'reference_javascript',
          },
          {
            label: 'Management API',
            icon: 'reference-api',
            href: '/reference/api/introduction',
            level: 'reference_javascript',
          },
        ],
        [
          { label: 'Data API' },
          {
            label: 'REST',
            icon: 'rest',
            href: '/guides/api',
            level: 'api',
          },
          {
            label: 'GraphQL',
            icon: 'graphql',
            href: '/guides/graphql',
            level: 'graphql',
          },
        ],
      ],
    },
  ],
  [
    {
      label: 'Resources',
      menuItems: [
        [
          {
            label: 'Migration guides',
            icon: 'resources',
            href: '/guides/resources',
            level: 'resources',
          },
          {
            label: 'Changelog',
            icon: 'changelog',
            hasLightIcon: true,
            href: 'https://supabase.com/changelog',
            level: 'changelog',
          },
          {
            label: 'Status',
            icon: 'status',
            href: 'https://status.supabase.com/',
          },
          {
            label: 'Contributing',
            icon: 'contributing',
            href: '/contributing' as `/${string}`,
          },
        ],
      ],
    },
  ],
]

export const REFERENCES: References = {
  javascript: {
    name: 'supabase-js',
    library: 'supabase-js',
    versions: ['v2', 'v1'],
    icon: '/img/libraries/javascript-icon',
    __MIGRATED_VERSIONS: ['v2'],
  },
  dart: {
    name: 'Flutter',
    library: 'supabase-dart',
    versions: ['v2', 'v1'],
    icon: '/docs/img/libraries/flutter-icon.svg',
  },
  csharp: {
    name: 'C#',
    library: 'supabase-csharp',
    versions: ['v1', 'v0'],
    icon: '/docs/img/libraries/c-sharp-icon.svg',
  },
  swift: {
    name: 'Swift',
    library: 'supabase-swift',
    versions: ['v2', 'v1'],
    icon: '/docs/img/libraries/swift-icon.svg',
  },
  kotlin: {
    name: 'Kotlin',
    library: 'supabase-kt',
    versions: ['v2', 'v1'],
    icon: '/docs/img/libraries/kotlin-icon.svg',
  },
  cli: {
    name: 'CLI',
    library: undefined,
    versions: [],
    icon: '/docs/img/icons/cli-icon.svg',
  },
  api: {
    name: 'API',
    library: undefined,
    versions: [],
    icon: '/docs/img/icons/api-icon.svg',
  },
}

export const gettingstarted: NavMenuConstant = {
  icon: 'getting-started',
  title: 'Start with Supabase',
  url: '/guides/getting-started',
  items: [
    { name: 'Features', url: '/guides/getting-started/features' },
    { name: 'Architecture', url: '/guides/getting-started/architecture' },
    {
      name: 'Framework Quickstarts',
      items: [
        { name: 'Next.js', url: '/guides/getting-started/quickstarts/nextjs' },
        { name: 'React', url: '/guides/getting-started/quickstarts/reactjs' },
        { name: 'NuxtJS', url: '/guides/getting-started/quickstarts/nuxtjs' },
        { name: 'Vue', url: '/guides/getting-started/quickstarts/vue' },
        { name: 'Flutter', url: '/guides/getting-started/quickstarts/flutter' },
        { name: 'iOS SwiftUI', url: '/guides/getting-started/quickstarts/ios-swiftui' },
        {
          name: 'Android Kotlin',
          url: '/guides/getting-started/quickstarts/kotlin',
        },
        {
          name: 'SvelteKit',
          url: '/guides/getting-started/quickstarts/sveltekit',
        },
        {
          name: 'Laravel PHP',
          url: '/guides/getting-started/quickstarts/laravel',
        },
        {
          name: 'Ruby on Rails',
          url: '/guides/getting-started/quickstarts/ruby-on-rails',
        },
        { name: 'SolidJS', url: '/guides/getting-started/quickstarts/solidjs' },
        {
          name: 'RedwoodJS',
          url: '/guides/getting-started/quickstarts/redwoodjs',
        },
        { name: 'refine', url: '/guides/getting-started/quickstarts/refine' },
      ],
    },
    {
      name: 'Web app demos',
      items: [
        {
          name: 'Next.js',
          url: '/guides/getting-started/tutorials/with-nextjs',
        },
        {
          name: 'React',
          url: '/guides/getting-started/tutorials/with-react',
        },
        {
          name: 'Vue 3',
          url: '/guides/getting-started/tutorials/with-vue-3',
        },
        {
          name: 'Nuxt 3',
          url: '/guides/getting-started/tutorials/with-nuxt-3',
        },
        {
          name: 'Angular',
          url: '/guides/getting-started/tutorials/with-angular',
        },
        {
          name: 'RedwoodJS',
          url: '/guides/getting-started/tutorials/with-redwoodjs',
        },
        {
          name: 'SolidJS',
          url: '/guides/getting-started/tutorials/with-solidjs',
        },
        {
          name: 'Svelte',
          url: '/guides/getting-started/tutorials/with-svelte',
        },
        {
          name: 'SvelteKit',
          url: '/guides/getting-started/tutorials/with-sveltekit',
        },
        {
          name: 'refine',
          url: '/guides/getting-started/tutorials/with-refine',
        },
      ],
    },
    {
      name: 'Mobile tutorials',
      items: [
        {
          name: 'Flutter',
          url: '/guides/getting-started/tutorials/with-flutter',
        },
        {
          name: 'Expo React Native',
          url: '/guides/getting-started/tutorials/with-expo-react-native',
        },
        {
          name: 'Android Kotlin',
          url: '/guides/getting-started/tutorials/with-kotlin',
        },
        {
          name: 'Ionic React',
          url: '/guides/getting-started/tutorials/with-ionic-react',
        },
        {
          name: 'Ionic Vue',
          url: '/guides/getting-started/tutorials/with-ionic-vue',
        },
        {
          name: 'Ionic Angular',
          url: '/guides/getting-started/tutorials/with-ionic-angular',
        },
        {
          name: 'Swift',
          url: '/guides/getting-started/tutorials/with-swift',
        },
      ],
    },
  ],
}

export const cli = {
  title: 'CLI',
  items: [
    { name: 'Overview', url: '/guides/cli' },
    { name: 'Managing Environments', url: '/guides/cli/managing-environments' },
    {
      name: 'Using environment variables in config.toml',
      url: '/guides/cli/using-environment-variables-in-config',
    },
  ],
}

export const NativeMobileLoginItems = [
  {
    name: 'Apple',
    icon: '/docs/img/icons/apple-icon',
    url: '/guides/auth/social-login/auth-apple?platform=react-native',
  },
  {
    name: 'Google',
    icon: '/docs/img/icons/google-icon',
    url: '/guides/auth/social-login/auth-google?platform=react-native',
  },
]

export const SocialLoginItems = [
  {
    name: 'Google',
    icon: '/docs/img/icons/google-icon',
    url: '/guides/auth/social-login/auth-google',
  },
  {
    name: 'Facebook',
    icon: '/docs/img/icons/facebook-icon',
    url: '/guides/auth/social-login/auth-facebook',
  },
  {
    name: 'Apple',
    icon: '/docs/img/icons/apple-icon',
    url: '/guides/auth/social-login/auth-apple',
  },
  {
    name: 'Azure (Microsoft)',
    icon: '/docs/img/icons/microsoft-icon',
    url: '/guides/auth/social-login/auth-azure',
  },
  {
    name: 'Twitter',
    icon: '/docs/img/icons/twitter-icon',
    url: '/guides/auth/social-login/auth-twitter',
    hasLightIcon: true,
  },
  {
    name: 'GitHub',
    icon: '/docs/img/icons/github-icon',
    url: '/guides/auth/social-login/auth-github',
    isDarkMode: true,
    hasLightIcon: true,
  },
  {
    name: 'Gitlab',
    icon: '/docs/img/icons/gitlab-icon',
    url: '/guides/auth/social-login/auth-gitlab',
  },
  {
    name: 'Bitbucket',
    icon: '/docs/img/icons/bitbucket-icon',
    url: '/guides/auth/social-login/auth-bitbucket',
  },
  {
    name: 'Discord',
    icon: '/docs/img/icons/discord-icon',
    url: '/guides/auth/social-login/auth-discord',
  },
  {
    name: 'Figma',
    icon: '/docs/img/icons/figma-icon',
    url: '/guides/auth/social-login/auth-figma',
  },
  {
    name: 'Kakao',
    icon: '/docs/img/icons/kakao-icon',
    url: '/guides/auth/social-login/auth-kakao',
  },
  {
    name: 'Keycloak',
    icon: '/docs/img/icons/keycloak-icon',
    url: '/guides/auth/social-login/auth-keycloak',
  },
  {
    name: 'LinkedIn',
    icon: '/docs/img/icons/linkedin-icon',
    url: '/guides/auth/social-login/auth-linkedin',
  },
  {
    name: 'Notion',
    icon: '/docs/img/icons/notion-icon',
    url: '/guides/auth/social-login/auth-notion',
  },
  {
    name: 'Slack',
    icon: '/docs/img/icons/slack-icon',
    url: '/guides/auth/social-login/auth-slack',
  },
  {
    name: 'Spotify',
    icon: '/docs/img/icons/spotify-icon',
    url: '/guides/auth/social-login/auth-spotify',
  },
  {
    name: 'Twitch',
    icon: '/docs/img/icons/twitch-icon',
    url: '/guides/auth/social-login/auth-twitch',
  },
  {
    name: 'WorkOS',
    icon: '/docs/img/icons/workos-icon',
    url: '/guides/auth/social-login/auth-workos',
  },
  {
    name: 'Zoom',
    icon: '/docs/img/icons/zoom-icon',
    url: '/guides/auth/social-login/auth-zoom',
  },
]

export const PhoneLoginsItems = [
  {
    name: 'MessageBird',
    icon: '/docs/img/icons/messagebird-icon',
    linkDescription: 'Communication between businesses and their customers — across any channel.',
    url: '/guides/auth/phone-login/messagebird',
  },
  {
    name: 'Twilio',
    icon: '/docs/img/icons/twilio-icon',
    url: '/guides/auth/phone-login/twilio',
    linkDescription: 'Customer engagement platform used by hundreds of thousands of businesses.',
  },
  {
    name: 'Vonage',
    icon: '/docs/img/icons/vonage-icon',
    url: '/guides/auth/phone-login/vonage',
    linkDescription:
      'Vonage is a communication platform as a service (CPaaS) provider for consumers and businesses.',
    isDarkMode: true,
    hasLightIcon: true,
  },
  {
    name: 'Textlocal (Community Supported)',
    icon: '/docs/img/icons/textlocal-icon',
    url: '/guides/auth/phone-login/textlocal',
    linkDescription: 'Textlocal is a cloud-based SMS platform offering bulk messaging services.',
  },
]

export const auth = {
  icon: 'auth',
  title: 'Auth',
  items: [
    {
      name: 'Overview',
      url: '/guides/auth',
    },
    {
      name: 'Architecture',
      url: '/guides/auth/architecture',
    },
    {
      name: 'Getting Started',
      items: [
        {
          name: 'Next.js',
          url: '/guides/auth/quickstarts/nextjs',
        },
        { name: 'React', url: '/guides/auth/quickstarts/react', items: [] },
        {
          name: 'React Native',
          url: '/guides/auth/quickstarts/react-native',
        },
      ],
    },
    {
      name: 'Concepts',
      items: [
        { name: 'Users', url: '/guides/auth/users' },
        { name: 'Identities', url: '/guides/auth/identities' },
        {
          name: 'Sessions',
          url: '/guides/auth/sessions',
          items: [
            { name: 'Implicit flow', url: '/guides/auth/sessions/implicit-flow' },
            { name: 'PKCE flow', url: '/guides/auth/sessions/pkce-flow' },
          ],
        },
      ],
    },
    {
      name: 'Flows (How-tos)',
      items: [
        {
          name: 'Server-Side Rendering',
          url: '/guides/auth/server-side',
          items: [
            { name: 'Next.js guide', url: '/guides/auth/server-side/nextjs' },
            {
              name: 'SvelteKit guide',
              url: '/guides/auth/server-side/sveltekit',
            },
            { name: 'Creating a client', url: '/guides/auth/server-side/creating-a-client' },
            {
              name: 'Migrating from Auth Helpers',
              url: '/guides/auth/server-side/migrating-to-ssr-from-auth-helpers',
            },
            {
              name: 'Advanced guide',
              url: '/guides/auth/server-side/advanced-guide',
            },
          ],
        },
        { name: 'Password-based', url: '/guides/auth/passwords' },
        { name: 'Email (Magic Link or OTP)', url: '/guides/auth/auth-email-passwordless' },
        {
          name: 'Phone Login',
          url: '/guides/auth/phone-login',
        },
        {
          name: 'Social Login (OAuth)',
          url: '/guides/auth/social-login',
          items: [...SocialLoginItems],
        },
        {
          name: 'Enterprise SSO',
          url: '/guides/auth/enterprise-sso',
          items: [
            {
              name: 'SAML 2.0',
              url: '/guides/auth/enterprise-sso/auth-sso-saml',
            },
          ],
        },
        { name: 'Anonymous Sign-Ins', url: '/guides/auth/auth-anonymous' },
        { name: 'Mobile Deep Linking', url: '/guides/auth/native-mobile-deep-linking' },
        {
          name: 'Identity Linking',
          url: '/guides/auth/auth-identity-linking',
        },
        { name: 'Multi-Factor Authentication', url: '/guides/auth/auth-mfa' },
        {
          name: 'Signout',
          url: '/guides/auth/signout',
        },
      ],
    },
    {
      name: 'Configuration',
      items: [
        {
          name: 'General Configuration',
          url: '/guides/auth/general-configuration',
        },
        { name: 'Email Templates', url: '/guides/auth/auth-email-templates' },
        {
          name: 'Redirect URLs',
          url: '/guides/auth/redirect-urls',
        },
        { name: 'Auth Hooks', url: '/guides/auth/auth-hooks' },
        { name: 'Custom SMTP', url: '/guides/auth/auth-smtp' },
        { name: 'User Management', url: '/guides/auth/managing-user-data' },
      ],
    },
    {
      name: 'Security',
      items: [
        { name: 'Password Security', url: '/guides/auth/password-security' },
        { name: 'Rate Limits', url: '/guides/auth/rate-limits' },
        { name: 'Bot Detection (CAPTCHA)', url: '/guides/auth/auth-captcha' },
        { name: 'JWTs', url: '/guides/auth/jwts' },
        { name: 'Row Level Security', url: '/guides/database/postgres/row-level-security' },
        {
          name: 'Column Level Security',
          url: '/guides/database/postgres/column-level-security',
        },
        {
          name: 'Custom Claims & RBAC',
          url: '/guides/database/postgres/custom-claims-and-role-based-access-control-rbac',
        },
      ],
    },
    {
      name: 'Auth UI',
      url: undefined,
      items: [
        { name: 'Auth UI (Deprecated)', url: '/guides/auth/auth-helpers/auth-ui' },
        {
          name: 'Flutter Auth UI',
          url: '/guides/auth/auth-helpers/flutter-auth-ui',
        },
      ],
    },
  ],
}

export const database: NavMenuConstant = {
  icon: 'database',
  title: 'Database',
  url: '/guides/database/overview',
  items: [
    { name: 'Overview', url: '/guides/database/overview' },
    {
      name: 'Fundamentals',
      url: undefined,
      items: [
        {
          name: 'Connecting to your database',
          url: '/guides/database/connecting-to-postgres',
          items: [
            {
              name: 'Serverless Drivers',
              url: '/guides/database/connecting-to-postgres/serverless-drivers',
            },
          ],
        },
        { name: 'Importing data', url: '/guides/database/import-data' },
        { name: 'Securing your data', url: '/guides/database/secure-data' },
      ],
    },
    {
      name: 'Working with your database (basics)',
      url: undefined,
      items: [
        {
          name: 'Managing tables, views, and data',
          url: '/guides/database/tables',
        },
        {
          name: 'Working with arrays',
          url: '/guides/database/arrays',
        },
        { name: 'Managing indexes', url: '/guides/database/postgres/indexes' },
        {
          name: 'Querying joins and nested tables',
          url: '/guides/database/joins-and-nesting',
        },
        { name: 'JSON and unstructured data', url: '/guides/database/json' },
      ],
    },
    {
      name: 'Working with your database (intermediate)',
      url: undefined,
      items: [
        {
          name: 'Implementing cascade deletes',
          url: '/guides/database/postgres/cascade-deletes',
        },
        { name: 'Managing enums', url: '/guides/database/postgres/enums' },
        {
          name: 'Managing database functions',
          url: '/guides/database/functions',
        },
        {
          name: 'Managing database triggers',
          url: '/guides/database/postgres/triggers',
        },
        {
          name: 'Managing database webhooks',
          url: '/guides/database/webhooks',
        },
        {
          name: 'Using Full Text Search',
          url: '/guides/database/full-text-search',
        },
        {
          name: 'Partitioning your tables',
          url: '/guides/database/partitions',
        },
      ],
    },
    {
      name: 'Access and security',
      url: undefined,
      items: [
        {
          name: 'Row Level Security',
          url: '/guides/database/postgres/row-level-security',
        },
        {
          name: 'Column Level Security',
          url: '/guides/database/postgres/column-level-security',
        },
        {
          name: 'Hardening the Data API',
          url: '/guides/database/hardening-data-api',
        },
        {
          name: 'Custom Claims & RBAC',
          url: '/guides/database/postgres/custom-claims-and-role-based-access-control-rbac',
        },
        {
          name: 'Managing Postgres Roles',
          url: '/guides/database/postgres/roles',
        },
        { name: 'Managing secrets with Vault', url: '/guides/database/vault' },
        {
          name: 'Superuser Access and Unsupported Operations',
          url: '/guides/database/postgres/roles-superuser',
        },
      ],
    },
    {
      name: 'Configuration, optimization, and testing',
      url: undefined,
      items: [
        {
          name: 'Database configuration',
          url: '/guides/database/postgres/configuration',
        },
        {
          name: 'Managing database replication',
          url: '/guides/database/replication',
        },
        {
          name: 'Query optimization',
          url: '/guides/database/query-optimization',
        },
        {
          name: 'Database Advisors',
          url: '/guides/database/database-advisors',
        },
        { name: 'Testing your database', url: '/guides/database/testing' },
      ],
    },
    {
      name: 'Debugging',
      url: undefined,
      items: [
        {
          name: 'Timeouts',
          url: '/guides/database/postgres/timeouts',
        },
        {
          name: 'Debugging and monitoring',
          url: '/guides/database/inspect',
        },
        {
          name: 'Debugging performance issues',
          url: '/guides/database/debugging-performance',
        },
      ],
    },
    {
      name: 'Extensions',
      url: undefined,
      items: [
        { name: 'Overview', url: '/guides/database/extensions' },
        {
          name: 'HypoPG: Hypothetical indexes',
          url: '/guides/database/extensions/hypopg',
        },
        {
          name: 'plv8: Javascript Language',
          url: '/guides/database/extensions/plv8',
        },
        {
          name: 'http: RESTful Client',
          url: '/guides/database/extensions/http',
        },
        {
          name: 'index_advisor: Query optimization',
          url: '/guides/database/extensions/index_advisor',
        },
        {
          name: 'PGAudit: Postgres Auditing',
          url: '/guides/database/extensions/pgaudit',
        },
        {
          name: 'pgjwt: JSON Web Tokens',
          url: '/guides/database/extensions/pgjwt',
        },
        {
          name: 'PGroonga: Multilingual Full Text Search',
          url: '/guides/database/extensions/pgroonga',
        },
        {
          name: 'pgRouting: Geospatial Routing',
          url: '/guides/database/extensions/pgrouting',
        },
        {
          name: 'pg_cron: Job Scheduling',
          url: '/guides/database/extensions/pg_cron',
        },
        {
          name: 'pg_graphql: GraphQL Support',
          url: '/guides/database/extensions/pg_graphql',
        },
        {
          name: 'pg_hashids: Short UIDs',
          url: '/guides/database/extensions/pg_hashids',
        },
        {
          name: 'pg_jsonschema: JSON Schema Validation',
          url: '/guides/database/extensions/pg_jsonschema',
        },
        {
          name: 'pg_net: Async Networking',
          url: '/guides/database/extensions/pg_net',
        },
        {
          name: 'pg_plan_filter: Restrict Total Cost',
          url: '/guides/database/extensions/pg_plan_filter',
        },
        {
          name: 'pg_stat_monitor: Extended Query Performance Monitoring',
          url: '/guides/database/extensions/pg_stat_monitor',
        },
        {
          name: 'pgvector: Embeddings and vector similarity',
          url: '/guides/database/extensions/pgvector',
        },
        {
          name: 'pg_stat_statements: SQL Planning and Execution Statistics',
          url: '/guides/database/extensions/pg_stat_statements',
        },
        {
          name: 'PostGIS: Geo queries',
          url: '/guides/database/extensions/postgis',
        },
        {
          name: 'pgsodium (pending deprecation): Encryption Features',
          url: '/guides/database/extensions/pgsodium',
        },
        {
          name: 'pgTAP: Unit Testing',
          url: '/guides/database/extensions/pgtap',
        },
        {
          name: 'plpgsql_check: PL/pgSQL Linter',
          url: '/guides/database/extensions/plpgsql_check',
        },
        {
          name: 'timescaledb: Time-series data',
          url: '/guides/database/extensions/timescaledb',
        },
        {
          name: 'uuid-ossp: Unique Identifiers',
          url: '/guides/database/extensions/uuid-ossp',
        },
        {
          name: 'RUM: inverted index for full-text search',
          url: '/guides/database/extensions/rum',
        },
      ],
    },
    {
      name: 'Foreign Data Wrappers',
      url: undefined,
      items: [
        {
          name: 'Overview',
          url: '/guides/database/extensions/wrappers/overview',
        },
        {
          name: 'Connecting to Auth0',
          url: '/guides/database/extensions/wrappers/auth0',
        },
        {
          name: 'Connecting to Airtable',
          url: '/guides/database/extensions/wrappers/airtable',
        },
        {
          name: 'Connecting to AWS Cognito',
          url: '/guides/database/extensions/wrappers/cognito',
        },
        {
          name: 'Connecting to AWS S3',
          url: '/guides/database/extensions/wrappers/s3',
        },
        {
          name: 'Connecting to BigQuery',
          url: '/guides/database/extensions/wrappers/bigquery',
        },
        {
          name: 'Connecting to ClickHouse',
          url: '/guides/database/extensions/wrappers/clickhouse',
        },
        {
          name: 'Connecting to Firebase',
          url: '/guides/database/extensions/wrappers/firebase',
        },
        {
          name: 'Connecting to Logflare',
          url: '/guides/database/extensions/wrappers/logflare',
        },
        {
          name: 'Connecting to MSSQL',
          url: '/guides/database/extensions/wrappers/mssql',
        },
        {
          name: 'Connecting to Paddle',
          url: '/guides/database/extensions/wrappers/paddle',
        },
        {
          name: 'Connecting to Redis',
          url: '/guides/database/extensions/wrappers/redis',
        },
        {
          name: 'Connecting to Snowflake',
          url: '/guides/database/extensions/wrappers/snowflake',
        },
        {
          name: 'Connecting to Stripe',
          url: '/guides/database/extensions/wrappers/stripe',
        },
      ],
    },
    {
      name: 'Examples',
      url: undefined,
      items: [
        {
          name: 'Drop All Tables in Schema',
          url: '/guides/database/postgres/dropping-all-tables-in-schema',
        },
        {
          name: 'Select First Row per Group',
          url: '/guides/database/postgres/first-row-in-group',
        },
        {
          name: 'Print PostgreSQL Version',
          url: '/guides/database/postgres/which-version-of-postgres',
        },
        {
          name: 'Replicating from Supabase to External Postgres',
          url: '/guides/database/postgres/setup-replication-external',
        },
      ],
    },
  ],
}

export const api: NavMenuConstant = {
  icon: 'rest',
  title: 'REST API',
  url: '/guides/api',
  items: [
    { name: 'Overview', url: '/guides/api', items: [] },
    { name: 'Quickstart', url: '/guides/api/quickstart', items: [] },
    {
      name: 'Client Libraries',
      url: '/guides/api/rest/client-libs',
      items: [],
    },
    {
      name: 'Auto-generated Docs',
      url: '/guides/api/rest/auto-generated-docs',
      items: [],
    },
    {
      name: 'Generating TypeScript Types',
      url: '/guides/api/rest/generating-types',
      items: [],
    },
    {
      name: 'Tools',
      url: '/guides/api',
      items: [{ name: 'SQL to REST API Translator', url: '/guides/api/sql-to-rest' }],
    },
    {
      name: 'Guides',
      url: '/guides/api',
      items: [
        { name: 'Creating API routes', url: '/guides/api/creating-routes' },
        { name: 'How API Keys work', url: '/guides/api/api-keys' },
        { name: 'Securing your API', url: '/guides/api/securing-your-api' },
      ],
    },
    {
      name: 'Using the Data APIs',
      url: '/guides/api/data-apis',
      items: [
        {
          name: 'Managing tables, views, and data',
          url: '/guides/database/tables',
        },
        {
          name: 'Querying joins and nested tables',
          url: '/guides/database/joins-and-nesting',
        },
        {
          name: 'JSON and unstructured data',
          url: '/guides/database/json',
        },
        {
          name: 'Managing database functions',
          url: '/guides/database/functions',
        },
        {
          name: 'Using full-text search',
          url: '/guides/database/full-text-search',
        },
        {
          name: 'Debugging performance issues',
          url: '/guides/database/debugging-performance',
        },
        {
          name: 'Using custom schemas',
          url: '/guides/api/using-custom-schemas',
        },
        {
          name: 'Converting from SQL to JavaScript API',
          url: '/guides/api/sql-to-api',
        },
      ],
    },
  ],
}

export const graphql: NavMenuConstant = {
  icon: 'graphql',
  title: 'GraphQL',
  url: '/guides/graphql',
  items: [
    { name: 'Overview', url: '/guides/graphql', items: [] },
    { name: 'API', url: '/guides/graphql/api', items: [] },
    { name: 'Views', url: '/guides/graphql/views', items: [] },
    { name: 'Functions', url: '/guides/graphql/functions', items: [] },
    {
      name: 'Configuration & Customization',
      url: '/guides/graphql/configuration',
      items: [],
    },
    { name: 'Security', url: '/guides/graphql/security', items: [] },
    {
      name: 'Integrations',
      items: [
        { name: 'With Apollo', url: '/guides/graphql/with-apollo' },
        { name: 'With Relay', url: '/guides/graphql/with-relay' },
      ],
    },
  ],
}

export const functions: NavMenuConstant = {
  icon: 'edge-functions',
  title: 'Edge Functions',
  url: '/guides/functions',
  items: [
    {
      name: 'Overview',
      url: '/guides/functions',
    },
    {
      name: 'Getting started',
      url: undefined,
      items: [
        {
          name: 'Create an Edge Function',
          url: '/guides/functions/quickstart',
        },
        {
          name: 'Deploy to Production',
          url: '/guides/functions/deploy',
        },
        {
          name: 'Setting up your editor',
          url: '/guides/functions/local-development',
        },
      ],
    },
    {
      name: 'Guides',
      url: undefined,
      items: [
        { name: 'Managing dependencies', url: '/guides/functions/import-maps' },
        {
          name: 'Managing environment variables',
          url: '/guides/functions/secrets',
        },
        {
          name: 'Integrating with Supabase Auth',
          url: '/guides/functions/auth',
        },
        {
          name: 'Integrating with Postgres',
          url: '/guides/functions/connect-to-postgres',
        },
        {
          name: 'Integrating with Supabase Storage',
          url: '/guides/functions/storage-caching',
        },
        {
          name: 'Handling Routing in Functions',
          url: '/guides/functions/routing',
        },
        {
          name: 'Running AI Models',
          url: '/guides/functions/ai-models',
        },
        {
          name: 'Deploying with CI / CD pipelines',
          url: '/guides/functions/cicd-workflow',
        },
      ],
    },
    {
      name: 'Debugging',
      url: undefined,
      items: [
        {
          name: 'Local Debugging with DevTools',
          url: '/guides/functions/debugging-tools',
        },
        {
          name: 'Logging',
          url: '/guides/functions/logging',
        },
        {
          name: 'Troubleshooting Common Issues',
          url: '/guides/functions/troubleshooting',
        },
        {
          name: 'Testing your Edge Functions',
          url: '/guides/functions/unit-test',
        },
        {
          name: 'Monitoring with Sentry',
          url: '/guides/functions/examples/sentry-monitoring',
        },
      ],
    },
    {
      name: 'Platform',
      url: undefined,
      items: [
        {
          name: 'Regional invocations',
          url: '/guides/functions/regional-invocation',
        },
        {
          name: 'Status codes',
          url: '/guides/functions/status-codes',
        },
        {
          name: 'Limits',
          url: '/guides/functions/limits',
        },
      ],
    },
    {
      name: 'Examples',
      url: undefined,
      items: [
        {
          name: 'CORS support for invoking from the browser',
          url: '/guides/functions/cors',
        },
        {
          name: 'Scheduling Functions',
          url: '/guides/functions/schedule-functions',
        },
        {
          name: 'Sending Push Notifications',
          url: '/guides/functions/examples/push-notifications',
        },
        {
          name: 'Generating AI images',
          url: '/guides/functions/examples/amazon-bedrock-image-generator',
        },
        {
          name: 'Generating OG images ',
          url: '/guides/functions/examples/og-image',
        },
        {
          name: 'Semantic AI Search',
          url: '/guides/functions/examples/semantic-search',
        },
        {
          name: 'CAPTCHA support with Cloudflare Turnstile',
          url: '/guides/functions/examples/cloudflare-turnstile',
        },
        {
          name: 'Building a Discord Bot',
          url: '/guides/functions/examples/discord-bot',
        },
        {
          name: 'Building a Telegram Bot',
          url: '/guides/functions/examples/telegram-bot',
        },
        {
          name: 'Handling Stripe Webhooks ',
          url: '/guides/functions/examples/stripe-webhooks',
        },
        {
          name: 'Rate-limiting with Redis',
          url: '/guides/functions/examples/rate-limiting',
        },
        {
          name: 'Taking Screenshots with Puppeteer',
          url: '/guides/functions/examples/screenshots',
        },
        {
          name: 'Slack Bot responding to mentions',
          url: '/guides/functions/examples/slack-bot-mention',
        },
      ],
    },
    {
      name: 'Third-Party Tools',
      url: undefined,
      items: [
        { name: 'Dart Edge on Supabase', url: '/guides/functions/dart-edge' },
        {
          name: 'Browserless.io',
          url: '/guides/functions/examples/screenshots',
        },
        {
          name: 'Hugging Face',
          url: '/guides/ai/examples/huggingface-image-captioning',
        },
        {
          name: 'Monitoring with Sentry',
          url: '/guides/functions/examples/sentry-monitoring',
        },
        { name: 'OpenAI API', url: '/guides/ai/examples/openai' },
        {
          name: 'Sending Emails with Resend',
          url: '/guides/functions/examples/send-emails',
        },
        {
          name: 'Upstash Redis',
          url: '/guides/functions/examples/upstash-redis',
        },
        {
          name: 'Type-Safe SQL with Kysely',
          url: '/guides/functions/kysely-postgres',
        },
      ],
    },
  ],
}

export const realtime: NavMenuConstant = {
  icon: 'realtime',
  title: 'Realtime',
  url: '/guides/realtime',
  items: [
    {
      name: 'Overview',
      url: '/guides/realtime',
    },
    {
      name: 'Concepts',
      url: '/guides/realtime/concepts',
    },
    {
      name: 'Usage',
      url: undefined,
      items: [
        { name: 'Broadcast', url: '/guides/realtime/broadcast' },
        { name: 'Presence', url: '/guides/realtime/presence' },
        {
          name: 'Postgres Changes',
          url: '/guides/realtime/postgres-changes',
        },
      ],
    },
    {
      name: 'Security',
      url: undefined,
      items: [{ name: 'Authorization', url: '/guides/realtime/authorization' }],
    },
    {
      name: 'Guides',
      url: undefined,
      items: [
        {
          name: 'Subscribing to Database Changes',
          url: '/guides/realtime/subscribing-to-database-changes',
        },
        {
          name: 'Using Realtime with Next.js',
          url: '/guides/realtime/realtime-with-nextjs',
        },
        {
          name: 'Using Realtime Presence with Flutter',
          url: '/guides/realtime/realtime-user-presence',
        },
        {
          name: 'Listening to Postgres Changes with Flutter',
          url: '/guides/realtime/realtime-listening-flutter',
        },
      ],
    },
    {
      name: 'Deep dive',
      url: undefined,
      items: [
        { name: 'Quotas', url: '/guides/realtime/quotas' },
        { name: 'Architecture', url: '/guides/realtime/architecture' },
        { name: 'Message Protocol', url: '/guides/realtime/protocol', items: [] },
      ],
    },
    {
      name: 'Debugging',
      url: undefined,
      items: [{ name: 'Operational Error Codes', url: '/guides/realtime/error_codes', items: [] }],
    },
  ],
}

export const storage: NavMenuConstant = {
  icon: 'storage',
  title: 'Storage',
  url: '/guides/storage',
  items: [
    { name: 'Overview', url: '/guides/storage' },
    { name: 'Quickstart', url: '/guides/storage/quickstart' },
    {
      name: 'Buckets',
      url: undefined,
      items: [
        { name: 'Fundamentals', url: '/guides/storage/buckets/fundamentals' },
        {
          name: 'Creating Buckets',
          url: '/guides/storage/buckets/creating-buckets',
        },
      ],
    },
    {
      name: 'Security',
      url: undefined,
      items: [
        {
          name: 'Ownership',
          url: '/guides/storage/security/ownership',
        },
        {
          name: 'Access Control',
          url: '/guides/storage/security/access-control',
        },
      ],
    },
    {
      name: 'Uploads',
      url: undefined,
      items: [
        {
          name: 'Standard Uploads',
          url: '/guides/storage/uploads/standard-uploads',
        },
        {
          name: 'Resumable Uploads',
          url: '/guides/storage/uploads/resumable-uploads',
        },
        {
          name: 'S3 Uploads',
          url: '/guides/storage/uploads/s3-uploads',
        },
        { name: 'Limits', url: '/guides/storage/uploads/file-limits' },
      ],
    },
    {
      name: 'Serving',
      url: undefined,
      items: [
        { name: 'Serving assets', url: '/guides/storage/serving/downloads' },
        {
          name: 'Image Transformations',
          url: '/guides/storage/serving/image-transformations',
        },
        {
          name: 'Bandwidth & Storage Egress',
          url: '/guides/storage/serving/bandwidth',
        },
      ],
    },
    {
      name: 'Management',
      url: undefined,
      items: [
        { name: 'Copy / Move Objects', url: '/guides/storage/management/copy-move-objects' },
        { name: 'Delete Objects', url: '/guides/storage/management/delete-objects' },
      ],
    },
    {
      name: 'S3',
      url: undefined,
      items: [
        { name: 'Authentication', url: '/guides/storage/s3/authentication' },
        { name: 'API Compatibility', url: '/guides/storage/s3/compatibility' },
      ],
    },
    {
      name: 'CDN',
      url: undefined,
      items: [
        { name: 'Fundamentals', url: '/guides/storage/cdn/fundamentals' },
        { name: 'Smart CDN', url: '/guides/storage/cdn/smart-cdn' },
        { name: 'Metrics', url: '/guides/storage/cdn/metrics' },
      ],
    },
    {
      name: 'Debugging',
      url: undefined,
      items: [
        { name: 'Logs', url: '/guides/storage/debugging/logs' },
        { name: 'Error Codes', url: '/guides/storage/debugging/error-codes' },
      ],
    },
    {
      name: 'Schema',
      url: undefined,
      items: [
        { name: 'Database Design', url: '/guides/storage/schema/design' },
        {
          name: 'Helper Functions',
          url: '/guides/storage/schema/helper-functions',
        },
        { name: 'Custom Roles', url: '/guides/storage/schema/custom-roles' },
      ],
    },
    {
      name: 'Going to production',
      url: undefined,
      items: [{ name: 'Scaling', url: '/guides/storage/production/scaling' }],
    },
  ],
}

export const vectorIndexItems = [
  {
    name: 'HNSW indexes',
    url: '/guides/ai/vector-indexes/hnsw-indexes',
  },
  {
    name: 'IVFFlat indexes',
    url: '/guides/ai/vector-indexes/ivf-indexes',
  },
]

export const ai = {
  icon: 'ai',
  title: 'AI & Vectors',
  url: '/guides/ai',
  items: [
    { name: 'Overview', url: '/guides/ai' },
    { name: 'Concepts', url: '/guides/ai/concepts' },
    {
      name: 'Structured & unstructured',
      url: '/guides/ai/structured-unstructured',
    },
    {
      name: 'Learn',
      url: undefined,
      items: [
        { name: 'Vector columns', url: '/guides/ai/vector-columns' },
        {
          name: 'Vector indexes',
          url: '/guides/ai/vector-indexes',
          items: vectorIndexItems,
        },
        {
          name: 'Engineering for scale',
          url: '/guides/ai/engineering-for-scale',
        },
        {
          name: 'Choosing Compute Add-on',
          url: '/guides/ai/choosing-compute-addon',
        },
        { name: 'Going to Production', url: '/guides/ai/going-to-prod' },
        {
          name: 'RAG with Permissions',
          url: '/guides/ai/rag-with-permissions',
        },
      ],
    },
    {
      name: 'Search',
      url: undefined,
      items: [
        { name: 'Semantic search', url: '/guides/ai/semantic-search' },
        { name: 'Keyword search', url: '/guides/ai/keyword-search' },
        { name: 'Hybrid search', url: '/guides/ai/hybrid-search' },
      ],
    },
    {
      name: 'JavaScript Examples',
      url: undefined,
      items: [
        {
          name: 'OpenAI completions using Edge Functions',
          url: '/guides/ai/examples/openai',
        },

        {
          name: 'Generate image captions using Hugging Face',
          url: '/guides/ai/examples/huggingface-image-captioning',
        },
        {
          name: 'Generate Embeddings',
          url: '/guides/ai/quickstarts/generate-text-embeddings',
        },

        {
          name: 'Adding generative Q&A to your documentation',
          url: '/guides/ai/examples/headless-vector-search',
        },
        {
          name: 'Adding generative Q&A to your Next.js site',
          url: '/guides/ai/examples/nextjs-vector-search',
        },
      ],
    },
    {
      name: 'Python Client',
      url: undefined,
      items: [
        { name: 'Choosing a Client', url: '/guides/ai/python-clients' },
        { name: 'API', url: '/guides/ai/python/api' },
        { name: 'Collections', url: '/guides/ai/python/collections' },
        { name: 'Indexes', url: '/guides/ai/python/indexes' },
        { name: 'Metadata', url: '/guides/ai/python/metadata' },
      ],
    },
    {
      name: 'Python Examples',
      url: undefined,
      items: [
        {
          name: 'Developing locally with Vecs',
          url: '/guides/ai/vecs-python-client',
        },
        {
          name: 'Creating and managing collections',
          url: '/guides/ai/quickstarts/hello-world',
        },

        {
          name: 'Text Deduplication',
          url: '/guides/ai/quickstarts/text-deduplication',
        },
        {
          name: 'Face similarity search',
          url: '/guides/ai/quickstarts/face-similarity',
        },
        {
          name: 'Image search with OpenAI CLIP',
          url: '/guides/ai/examples/image-search-openai-clip',
        },
        {
          name: 'Semantic search with Amazon Titan',
          url: '/guides/ai/examples/semantic-image-search-amazon-titan',
        },
        {
          name: 'Building ChatGPT Plugins',
          url: '/guides/ai/examples/building-chatgpt-plugins',
        },
      ],
    },
    {
      name: 'Third-Party Tools',
      url: undefined,
      items: [
        {
          name: 'LangChain',
          url: '/guides/ai/langchain',
        },
        {
          name: 'Hugging Face',
          url: '/guides/ai/hugging-face',
        },
        {
          name: 'Google Colab',
          url: '/guides/ai/google-colab',
        },
        {
          name: 'LlamaIndex',
          url: '/guides/ai/integrations/llamaindex',
        },
        {
          name: 'Roboflow',
          url: '/guides/ai/integrations/roboflow',
        },
        {
          name: 'Amazon Bedrock',
          url: '/guides/ai/integrations/amazon-bedrock',
        },
      ],
    },
  ],
}

export const supabase_cli: NavMenuConstant = {
  icon: 'dev-cli',
  title: 'Local Dev / CLI',
  url: '/guides/cli',
  items: [
    { name: 'Overview', url: '/guides/cli' },
    {
      name: 'Using the CLI',
      url: undefined,
      items: [
        { name: 'Getting started', url: '/guides/cli/getting-started' },
        { name: 'CLI Configuration', url: '/guides/cli/config' },
      ],
    },
    {
      name: 'Developing with Supabase',
      url: undefined,
      items: [
        { name: 'Local Development', url: '/guides/cli/local-development' },
        {
          name: 'Managing environments',
          url: '/guides/cli/managing-environments',
        },
        {
          name: 'Managing config and secrets',
          url: '/guides/cli/managing-config',
        },
        {
          name: 'Seeding your database',
          url: '/guides/cli/seeding-your-database',
        },
        {
          name: 'Testing and linting',
          url: '/guides/cli/testing-and-linting',
        },
        {
          name: 'Customizing email templates',
          url: '/guides/cli/customizing-email-templates',
        },
      ],
    },
    {
      name: 'GitHub Action',
      url: undefined,
      items: [
        {
          name: 'Generate types from your database',
          url: '/guides/cli/github-action/generating-types',
        },
        {
          name: 'Automated testing',
          url: '/guides/cli/github-action/testing',
        },
        {
          name: 'Backup your database',
          url: '/guides/cli/github-action/backups',
        },
      ],
    },
  ],
}

export const platform: NavMenuConstant = {
  icon: 'platform',
  title: 'Platform',
  url: '/guides/platform',
  items: [
    {
      name: 'Add-ons',
      url: undefined,
      items: [
        { name: 'Compute Add-ons', url: '/guides/platform/compute-add-ons' },
        { name: 'Custom Domains', url: '/guides/platform/custom-domains' },
        { name: 'Database Backups', url: '/guides/platform/backups' },
        { name: 'IPv4 Address', url: '/guides/platform/ipv4-address' },
        { name: 'Read Replicas', url: '/guides/platform/read-replicas' },
      ],
    },
    {
      name: 'Logging and observability',
      url: undefined,
      items: [
        { name: 'Logging', url: '/guides/platform/logs' },
        { name: 'Log Drains', url: '/guides/platform/log-drains' },
        { name: 'Metrics', url: '/guides/platform/metrics' },
        { name: 'Monitoring with Sentry', url: '/guides/platform/sentry-monitoring' },
      ],
    },
    {
      name: 'Platform Management',
      url: undefined,
      items: [
        { name: 'Regions', url: '/guides/platform/regions' },
        {
          name: 'Custom Postgres Config',
          url: '/guides/platform/custom-postgres-config',
        },
        { name: 'Database Size', url: '/guides/platform/database-size' },
        { name: 'Fly Postgres', url: '/guides/platform/fly-postgres' },
        {
          name: 'HTTP Status Codes',
          url: '/guides/platform/http-status-codes',
        },
        {
          name: 'Migrating and Upgrading',
          url: '/guides/platform/migrating-and-upgrading-projects',
        },
        {
          name: 'Multi-factor Authentication',
          url: '/guides/platform/multi-factor-authentication',
        },
        {
          name: 'Transfer Project',
          url: '/guides/platform/project-transfer',
        },
        {
          name: 'Network Restrictions',
          url: '/guides/platform/network-restrictions',
        },
        { name: 'Performance Tuning', url: '/guides/platform/performance' },
        { name: 'Branching', url: '/guides/platform/branching' },
      ],
    },
    {
      name: 'Security',
      url: undefined,
      items: [
        { name: 'Access Control', url: '/guides/platform/access-control' },
        { name: 'SSL Enforcement', url: '/guides/platform/ssl-enforcement' },
        { name: 'Platform-required Permissions', url: '/guides/platform/permissions' },
      ],
    },
    {
      name: 'Billing',
      url: undefined,
      items: [
        {
          name: 'How billing works',
          url: '/guides/platform/org-based-billing',
        },
        {
          name: 'Spend caps and cost-controls',
          url: '/guides/platform/spend-cap',
        },
        {
          name: 'Enterprise Billing',
          url: '/guides/platform/enterprise-billing',
        },
        {
          name: 'Billing FAQ',
          url: '/guides/platform/billing-faq',
        },
      ],
    },
    {
      name: 'Single sign-on',
      url: undefined,
      items: [
        {
          name: 'Enable SSO for your organization',
          url: '/guides/platform/sso',
        },
        { name: 'SSO with Azure AD', url: '/guides/platform/sso/azure' },
        {
          name: 'SSO with Google Workspace',
          url: '/guides/platform/sso/gsuite',
        },
        { name: 'SSO with Okta', url: '/guides/platform/sso/okta' },
      ],
    },
    {
      name: 'Terraform',
      url: undefined,
      items: [
        {
          name: 'Terraform Provider',
          url: '/guides/platform/terraform',
        },
        {
          name: 'Terraform Tutorial',
          url: '/guides/platform/terraform/tutorial',
        },
        {
          name: 'Reference',
          url: '/guides/platform/terraform/reference',
        },
      ],
    },
    {
      name: 'Production Readiness',
      url: undefined,
      items: [
        {
          name: 'Shared Responsibility Model',
          url: '/guides/platform/shared-responsibility-model',
        },
        {
          name: 'Maturity Model',
          url: '/guides/platform/maturity-model',
        },
        {
          name: 'Production Checklist',
          url: '/guides/platform/going-into-prod',
        },
      ],
    },
    {
      name: 'Integrations',
      url: undefined,
      items: [
        {
          name: 'Integrations Marketplace',
          url: '/guides/platform/marketplace',
        },
        {
          name: 'Build a Supabase Integration',
          url: '/guides/platform/oauth-apps/build-a-supabase-integration',
        },
        {
          name: 'OAuth Scopes',
          url: '/guides/platform/oauth-apps/oauth-scopes',
        },
      ],
    },
    {
      name: 'Troubleshooting',
      url: undefined,
      items: [
        {
          name: 'HTTP and Project Issues',
          url: '/guides/platform/troubleshooting',
        },
        {
          name: 'High Disk IO Consumption',
          url: '/guides/platform/exhaust-disk-io',
        },
        {
          name: 'High CPU Usage',
          url: '/guides/platform/exhaust-cpu',
        },
        {
          name: 'High RAM Usage',
          url: '/guides/platform/exhaust-ram',
        },
        {
          name: 'High Swap Usage',
          url: '/guides/platform/exhaust-swap',
        },
      ],
    },
  ],
}

export const resources: NavMenuConstant = {
  icon: 'resources',
  title: 'Resources',
  url: '/guides/resources',
  items: [
    { name: 'Examples', url: '/guides/resources/examples' },
    { name: 'Glossary', url: '/guides/resources/glossary' },
    {
      name: 'Migrate to Supabase',
      url: '/guides/resources/migrating-to-supabase',
      items: [
        {
          name: 'Auth0',
          url: '/guides/resources/migrating-to-supabase/auth0',
        },
        {
          name: 'Firebase Auth',
          url: '/guides/resources/migrating-to-supabase/firebase-auth',
        },
        {
          name: 'Firestore Data',
          url: '/guides/resources/migrating-to-supabase/firestore-data',
        },
        {
          name: 'Firebase Storage',
          url: '/guides/resources/migrating-to-supabase/firebase-storage',
        },
        {
          name: 'Heroku',
          url: '/guides/resources/migrating-to-supabase/heroku',
        },
        {
          name: 'Render',
          url: '/guides/resources/migrating-to-supabase/render',
        },
        {
          name: 'Amazon RDS',
          url: '/guides/resources/migrating-to-supabase/amazon-rds',
          items: [],
        },
        {
          name: 'Postgres',
          url: '/guides/resources/migrating-to-supabase/postgres',
          items: [],
        },
        {
          name: 'MySQL',
          url: '/guides/resources/migrating-to-supabase/mysql',
          items: [],
        },
        {
          name: 'MSSQL',
          url: '/guides/resources/migrating-to-supabase/mssql',
          items: [],
        },
      ],
    },
  ],
}

export const self_hosting: NavMenuConstant = {
  title: 'Self-Hosting',
  icon: 'self-hosting',
  url: '/guides/self-hosting',
  items: [
    { name: 'Overview', url: '/guides/self-hosting' },
    { name: 'Self-Hosting with Docker', url: '/guides/self-hosting/docker' },
    {
      name: 'Auth Server',
      items: [
        { name: 'Reference', url: '/reference/self-hosting-auth/introduction' },
        { name: 'Configuration', url: '/guides/self-hosting/auth/config' },
      ],
    },
    {
      name: 'Storage Server',
      items: [
        {
          name: 'Reference',
          url: '/reference/self-hosting-storage/introduction',
        },
        { name: 'Configuration', url: '/guides/self-hosting/storage/config' },
      ],
    },
    {
      name: 'Realtime Server',
      items: [
        {
          name: 'Reference',
          url: '/reference/self-hosting-realtime/introduction',
        },
        { name: 'Configuration', url: '/guides/self-hosting/realtime/config' },
      ],
    },
    {
      name: 'Analytics Server',
      items: [
        {
          name: 'Reference',
          url: '/reference/self-hosting-analytics/introduction',
          items: [],
        },
        {
          name: 'Configuration',
          url: '/guides/self-hosting/analytics/config',
          items: [],
        },
      ],
    },
    {
      name: 'Functions Server',
      items: [
        {
          name: 'Reference',
          url: '/reference/self-hosting-functions/introduction',
          items: [],
        },
      ],
    },
  ],
}

export const migrate = {
  title: 'Migrate to Supabase',
  url: '/guides/migrate',
  items: [
    { name: 'Firebase Auth', url: '/guides/migrations/firebase-auth' },
    { name: 'Firestore Data', url: '/guides/migrations/firestore-data' },
    { name: 'Firebase Storage', url: '/guides/migrations/firebase-storage' },
    { name: 'Heroku', url: '/guides/migrations/heroku' },
    { name: 'Render', url: '/guides/migrations/render' },
    { name: 'Amazon RDS', url: '/guides/migrations/amazon-rds' },
  ],
}

export const reference = {
  title: 'API Reference',
  icon: 'reference',
  items: [
    {
      name: 'Client libraries',
      items: [
        {
          name: 'supabase-js',
          url: '/reference/javascript/start',
          level: 'reference_javascript',
          icon: '/img/icons/menu/reference-javascript',
        },
        {
          name: 'supabase-dart',
          url: '/reference/dart/start',
          level: 'reference_dart',
          icon: '/img/icons/menu/reference-dart',
        },
        {
          name: 'supabase-csharp',
          url: '/reference/csharp/start',
          level: 'reference_csharp',
          icon: '/img/icons/menu/reference-csharp',
        },
        {
          name: 'supbase-python',
          url: '/reference/python/start',
          level: 'reference_python',
          icon: '/img/icons/menu/reference-python',
        },
        {
          name: 'supbase-swift',
          url: '/reference/swift/start',
          level: 'reference_swift',
          items: [],
          icon: '/img/icons/menu/reference-swift',
        },
        {
          name: 'supabase-kt',
          url: '/reference/kotlin/start',
          level: 'reference_kotlin',
          items: [],
          icon: '/img/icons/menu/reference-kotlin',
        },
        // {
        //   name: 'supabase-python',
        //   url: '/reference/python/start',
        //   level: 'reference_python',
        //
        //   icon: '/img/icons/menu/reference-javascript',
        // },
      ],
    },
    {
      name: 'Other tools',
      items: [
        {
          name: 'Supabase CLI',
          url: '/reference/cli/start',
          icon: '/img/icons/menu/reference-cli',
        },
        {
          name: 'Management API',
          url: '/reference/javascript',
          icon: '/img/icons/menu/reference-api',
        },
      ],
    },
  ],
}

export const reference_javascript_v1 = {
  icon: 'reference-javascript',
  title: 'JavaScript',
  url: '/guides/reference/javascript',
  parent: '/reference',
}

export const reference_javascript_v2 = {
  icon: 'reference-javascript',
  title: 'JavaScript',
  url: '/guides/reference/javascript',
  parent: '/reference',
}

export const reference_dart_v1 = {
  icon: 'reference-dart',
  title: 'Flutter',
  url: '/guides/reference/dart',
  parent: '/reference',
}

export const reference_dart_v2 = {
  icon: 'reference-dart',
  title: 'Flutter',
  url: '/guides/reference/dart',
  parent: '/reference',
}

export const reference_csharp_v0 = {
  icon: 'reference-csharp',
  title: 'C#',
  url: 'guides/reference/csharp',
  parent: '/reference',
}

export const reference_csharp_v1 = {
  icon: 'reference-csharp',
  title: 'C#',
  url: 'guides/reference/csharp',
  parent: '/reference',
}

export const reference_python_v2 = {
  icon: 'reference-python',
  title: 'Python',
  url: '/guides/reference/python',
  parent: '/reference',
}

export const reference_swift_v1 = {
  icon: 'reference-swift',
  title: 'swift',
  url: 'guides/reference/swift',
  parent: '/reference',
}

export const reference_swift_v2 = {
  icon: 'reference-swift',
  title: 'swift',
  url: 'guides/reference/swift',
  parent: '/reference',
}

export const reference_kotlin_v1 = {
  icon: 'reference-kotlin',
  title: 'kotlin',
  url: 'guides/reference/kotlin',
  parent: '/reference',
}

export const reference_kotlin_v2 = {
  icon: 'reference-kotlin',
  title: 'kotlin',
  url: 'guides/reference/kotlin',
  parent: '/reference',
}

export const reference_cli = {
  icon: 'reference-cli',
  title: 'Supabase CLI',
  url: '/guides/reference/cli',
  parent: '/',
}
export const reference_api = {
  icon: 'reference-api',
  title: 'Management API',
  url: '/guides/reference/api',
  parent: '/reference',
}

export const reference_self_hosting_auth = {
  icon: 'self-hosting',
  title: 'Self-Hosting Auth',
  url: '/guides/reference/self-hosting/auth',
  parent: '/reference',
}

export const reference_self_hosting_storage = {
  icon: 'self-hosting',
  title: 'Self-Hosting Storage',
  url: '/guides/reference/self-hosting/storage',
  parent: '/reference',
}

export const reference_self_hosting_realtime = {
  icon: 'self-hosting',
  title: 'Self-Hosting Realtime',
  url: '/guides/reference/self-hosting/realtime',
  parent: '/reference',
}

export const reference_self_hosting_analytics = {
  icon: 'reference-analytics',
  title: 'Self-Hosting Analytics',
  url: '/guides/reference/self-hosting/analytics',
  parent: '/reference',
}

export const reference_self_hosting_functions = {
  icon: 'reference-functions',
  title: 'Self-Hosting Functions',
  url: '/guides/reference/self-hosting/functions',
  parent: '/reference',
}

export const references = [
  {
    label: 'Client libraries',
    items: [
      {
        label: 'supabase-js',
        versions: ['v2', 'v1'],
        description: 'something about the reference',
        icon: '/docs/img/icons/javascript-icon.svg',
        url: '/reference/javascript/start',
      },
      {
        label: 'supabase-py',
        description: 'something about the reference',
        icon: '/docs/img/icons/python-icon.svg',
        url: '/reference/python/start',
      },
      {
        label: 'supabase-dart',
        versions: ['v1', 'v0'],
        description: 'something about the reference',
        icon: '/docs/img/icons/dart-icon.svg',
        url: '/reference/dart/start',
      },
      {
        label: 'supabase-csharp',
        versions: ['v0'],
        description: 'something about the reference',
        icon: '/docs/img/icons/c-sharp-icon.svg',
        url: '/reference/csharp/start',
      },
      {
        label: 'supabase-swift',
        versions: ['v2', 'v1'],
        description: 'something about the reference',
        icon: '/docs/img/icons/swift-icon.svg',
        url: '/reference/swift/start',
      },
      {
        label: 'supabase-kt',
        versions: ['v2', 'v1'],
        description: 'something about the reference',
        icon: '/docs/img/icons/kotlin-icon.svg',
        url: '/reference/kotlin/start',
      },
    ],
  },
  {
    label: 'Platform Tools',
    items: [
      {
        label: 'CLI',
        description: 'something about the reference',
        icon: '/docs/img/icons/cli-icon.svg',
        url: '/reference/cli/start',
      },
      {
        label: 'Management API',
        description: 'something about the reference',
        icon: '/docs/img/icons/api-icon.svg',
        url: '/reference/management-api/start',
      },
    ],
  },
  {
    label: 'Self-Hosting',
    items: [
      {
        label: 'Auth server',
        description: 'something about the reference',
        icon: '/docs/img/icons/menu/auth.svg',
        url: '/reference/auth/start',
      },
      {
        label: 'Storage server',
        description: 'something about the reference',
        icon: '/docs/img/icons/menu/storage.svg',
        url: '/reference/storage/start',
      },
      {
        label: 'Realtime server',
        description: 'something about the reference',
        icon: '/docs/img/icons/menu/realtime.svg',
        url: '/reference/realtime/start',
      },
    ],
  },
]

export const navDataForMdx = {
  nativeMobileLoginItems: NativeMobileLoginItems,
  phoneLoginsItems: PhoneLoginsItems,
  socialLoginItems: SocialLoginItems,
}
