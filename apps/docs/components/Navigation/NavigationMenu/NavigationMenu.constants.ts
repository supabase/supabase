import type { ComponentProps } from 'react'

import type { IconPanel } from 'ui-patterns/IconPanel'

import type { GlobalMenuItems, NavMenuConstant, NavMenuSection } from '../Navigation.types'

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
        ],
        [
          { label: 'Postgres Modules' },
          {
            label: 'AI & Vectors',
            icon: 'ai',
            href: '/guides/ai',
            level: 'ai',
          },
          {
            label: 'Cron',
            icon: 'cron',
            href: '/guides/cron',
            level: 'cron',
          },
          {
            label: 'Queues',
            icon: 'queues',
            href: '/guides/queues',
            level: 'queues',
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
            label: 'Local Development & CLI',
            icon: 'dev-cli',
            href: '/guides/local-development',
            level: 'local_development',
          },
          {
            label: 'Deployment',
            icon: 'deployment',
            href: '/guides/deployment',
            level: 'deployment',
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
            href: '/guides/integrations',
            level: 'integrations',
          },
        ],
      ],
    },
  ],
  [
    {
      label: 'Manage',
      menuItems: [
        [
          {
            label: 'Platform Management',
            icon: 'platform',
            href: '/guides/platform',
            level: 'platform',
          },
          {
            label: 'Security & Compliance',
            icon: 'security',
            href: '/guides/security',
            level: 'security',
          },
          {
            label: 'Telemetry',
            icon: 'telemetry',
            href: '/guides/telemetry',
            level: 'telemetry',
          },
          {
            label: 'Troubleshooting',
            icon: 'troubleshooting',
            href: '/guides/troubleshooting',
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
            href: '/reference/javascript',
            level: 'reference_javascript',
          },
          {
            label: 'Flutter',
            icon: 'reference-dart',
            href: '/reference/dart',
            level: 'reference_dart',
          },
          {
            label: 'Swift',
            icon: 'reference-swift',
            href: '/reference/swift',
            level: 'reference_swift',
          },
          {
            label: 'Python',
            icon: 'reference-python',
            href: '/reference/python',
            level: 'reference_python',
          },
          {
            label: 'C#',
            icon: 'reference-csharp',
            href: '/reference/csharp',
            level: 'reference_csharp',
            community: true,
          },
          {
            label: 'Kotlin',
            icon: 'reference-kotlin',
            href: '/reference/kotlin',
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
            label: 'Glossary',
            icon: 'resources',
            href: '/guides/resources/glossary',
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
        { name: 'Nuxt', url: '/guides/getting-started/quickstarts/nuxtjs' },
        { name: 'Vue', url: '/guides/getting-started/quickstarts/vue' },
        { name: 'Hono', url: '/guides/getting-started/quickstarts/hono' },
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
    {
      name: 'AI Tools',
      url: undefined,
      items: [
        {
          name: 'Prompts',
          url: '/guides/getting-started/ai-prompts',
        },
        {
          name: 'Model context protocol (MCP)',
          url: '/guides/getting-started/mcp',
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
        { name: 'Web3 (Sign in with Solana)', url: '/guides/auth/auth-web3' },
        { name: 'Mobile Deep Linking', url: '/guides/auth/native-mobile-deep-linking' },
        {
          name: 'Identity Linking',
          url: '/guides/auth/auth-identity-linking',
        },
        {
          name: 'Multi-Factor Authentication',
          url: '/guides/auth/auth-mfa',
          items: [
            { name: 'App Authenticator (TOTP)', url: '/guides/auth/auth-mfa/totp' },
            { name: 'Phone', url: '/guides/auth/auth-mfa/phone' },
          ],
        },
        {
          name: 'Signout',
          url: '/guides/auth/signout',
        },
      ],
    },
    {
      name: 'Debugging',
      items: [{ name: 'Error Codes', url: '/guides/auth/debugging/error-codes' }],
    },
    {
      name: 'Third-party auth',
      items: [
        { name: 'Overview', url: '/guides/auth/third-party/overview' },
        { name: 'Clerk', url: '/guides/auth/third-party/clerk' },
        { name: 'Firebase Auth', url: '/guides/auth/third-party/firebase-auth' },
        { name: 'Auth0', url: '/guides/auth/third-party/auth0' },
        { name: 'AWS Cognito (Amplify)', url: '/guides/auth/third-party/aws-cognito' },
        { name: 'WorkOS', url: '/guides/auth/third-party/workos' },
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
        {
          name: 'Auth Hooks',
          url: '/guides/auth/auth-hooks',
          items: [
            {
              name: 'Custom access token hook',
              url: '/guides/auth/auth-hooks/custom-access-token-hook',
            },
            {
              name: 'Send SMS hook',
              url: '/guides/auth/auth-hooks/send-sms-hook',
            },
            {
              name: 'Send email hook',
              url: '/guides/auth/auth-hooks/send-email-hook',
            },
            {
              name: 'MFA verification hook',
              url: '/guides/auth/auth-hooks/mfa-verification-hook',
            },
            {
              name: 'Password verification hook',
              url: '/guides/auth/auth-hooks/password-verification-hook',
            },
            {
              name: 'Before User Created hook',
              url: '/guides/auth/auth-hooks/before-user-created-hook',
            },
          ],
        },
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
        {
          name: 'JSON Web Tokens (JWT)',
          url: '/guides/auth/jwts',
          items: [{ name: 'Claims Reference', url: '/guides/auth/jwt-fields' }],
        },
        { name: 'JWT Signing Keys', url: '/guides/auth/signing-keys' },
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

const ormQuickstarts: NavMenuSection = {
  name: 'ORM Quickstarts',
  url: undefined,
  items: [
    {
      name: 'Prisma',
      url: '/guides/database/prisma',
      items: [
        {
          name: 'Prisma troubleshooting',
          url: '/guides/database/prisma/prisma-troubleshooting',
        },
      ],
    },
    {
      name: 'Drizzle',
      url: '/guides/database/drizzle',
    },
    {
      name: 'Postgres.js',
      url: '/guides/database/postgres-js',
    },
  ],
}

const guiQuickstarts: NavMenuSection = {
  name: 'GUI quickstarts',
  url: undefined,
  items: [
    {
      name: 'pgAdmin',
      url: '/guides/database/pgadmin',
    },
    {
      name: 'PSQL',
      url: '/guides/database/psql',
    },
    {
      name: 'DBeaver',
      url: '/guides/database/dbeaver',
    },
    {
      name: 'Metabase',
      url: '/guides/database/metabase',
    },
    {
      name: 'Beekeeper Studio',
      url: '/guides/database/beekeeper-studio',
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
        {
          name: 'Managing connections',
          url: '/guides/database/connection-management',
        },
      ],
    },
    {
      name: 'OrioleDB',
      url: undefined,
      items: [
        {
          name: 'Overview',
          url: '/guides/database/orioledb',
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
        {
          name: 'Using Custom Postgres Roles',
          url: '/guides/storage/schema/custom-roles',
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
          name: 'Query optimization',
          url: '/guides/database/query-optimization',
        },
        {
          name: 'Database Advisors',
          url: '/guides/database/database-advisors',
        },
        { name: 'Testing your database', url: '/guides/database/testing' },
        {
          name: 'Customizing Postgres config',
          url: '/guides/database/custom-postgres-config',
        },
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
        {
          name: 'Supavisor',
          url: '/guides/database/supavisor',
        },
      ],
    },
    ormQuickstarts,
    guiQuickstarts,
    {
      name: 'Database replication',
      url: undefined,
      items: [
        { name: 'Overview', url: '/guides/database/replication' },
        {
          name: 'Setting up replication',
          url: '/guides/database/replication/setting-up-replication',
        },
        {
          name: 'Monitoring replication',
          url: '/guides/database/replication/monitoring-replication',
        },
        { name: 'FAQ', url: '/guides/database/replication/faq' },
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
          name: 'plv8 (deprecated)',
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
          name: 'pgjwt (deprecated)',
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
          name: 'pg_cron: Schedule Recurring Jobs',
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
          name: 'postgres_fdw: query data from an external Postgres server',
          url: '/guides/database/extensions/postgres_fdw',
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
          name: 'pg_repack: Storage Optimization',
          url: '/guides/database/extensions/pg_repack',
        },
        {
          name: 'PostGIS: Geo queries',
          url: '/guides/database/extensions/postgis',
        },
        {
          name: 'pgmq: Queues',
          url: '/guides/database/extensions/pgmq',
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
          name: 'timescaledb (deprecated)',
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
          name: 'Connecting to Clerk',
          url: '/guides/database/extensions/wrappers/clerk',
        },
        {
          name: 'Connecting to ClickHouse',
          url: '/guides/database/extensions/wrappers/clickhouse',
        },
        {
          name: 'Connecting to DuckDB',
          url: '/guides/database/extensions/wrappers/duckdb',
        },
        {
          name: 'Connecting to Firebase',
          url: '/guides/database/extensions/wrappers/firebase',
        },
        {
          name: 'Connecting to Iceberg',
          url: '/guides/database/extensions/wrappers/iceberg',
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
          name: 'Connecting to Notion',
          url: '/guides/database/extensions/wrappers/notion',
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

export const cron: NavMenuConstant = {
  icon: 'cron',
  title: 'Cron',
  url: '/guides/cron',
  items: [
    { name: 'Overview', url: '/guides/cron' },
    {
      name: 'Getting Started',
      url: undefined,
      items: [
        { name: 'Install', url: '/guides/cron/install' },
        { name: 'Quickstart', url: '/guides/cron/quickstart' },
      ],
    },
  ],
}

export const queues: NavMenuConstant = {
  icon: 'queues',
  title: 'Queues',
  url: '/guides/queues',
  items: [
    { name: 'Overview', url: '/guides/queues' },
    {
      name: 'Getting Started',
      url: undefined,
      items: [{ name: 'Quickstart', url: '/guides/queues/quickstart' }],
    },
    {
      name: 'References',
      url: undefined,
      items: [
        { name: 'API', url: '/guides/queues/api' },
        { name: 'PGMQ Extension', url: '/guides/queues/pgmq' },
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
          name: 'Quickstart (Dashboard)',
          url: '/guides/functions/quickstart-dashboard',
        },
        {
          name: 'Quickstart (CLI)',
          url: '/guides/functions/quickstart',
        },
        {
          name: 'Development Environment',
          url: '/guides/functions/development-environment',
        },
      ],
    },
    {
      name: 'Configuration',
      url: undefined,
      items: [
        { name: 'Environment Variables', url: '/guides/functions/secrets' },
        { name: 'Managing Dependencies', url: '/guides/functions/dependencies' },
        { name: 'Function Configuration', url: '/guides/functions/function-configuration' },
      ],
    },
    {
      name: 'Development',
      url: undefined,
      items: [
        { name: 'Error Handling', url: '/guides/functions/error-handling' },
        { name: 'Routing', url: '/guides/functions/routing' },
        {
          name: 'Deploy to Production',
          url: '/guides/functions/deploy',
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
          name: 'Testing your Functions',
          url: '/guides/functions/unit-test',
        },
        {
          name: 'Logging',
          url: '/guides/functions/logging',
        },
        {
          name: 'Troubleshooting',
          url: '/guides/functions/troubleshooting',
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
        {
          name: 'Pricing',
          url: '/guides/functions/pricing',
        },
      ],
    },
    {
      name: 'Integrations',
      url: undefined,
      items: [
        { name: 'Supabase Auth', url: '/guides/functions/auth' },
        { name: 'Supabase Database (Postgres)', url: '/guides/functions/connect-to-postgres' },
        { name: 'Supabase Storage', url: '/guides/functions/storage-caching' },
      ],
    },
    {
      name: 'Advanced Features',
      url: undefined,
      items: [
        { name: 'Background Tasks', url: '/guides/functions/background-tasks' },
        { name: 'Ephemeral Storage', url: '/guides/functions/ephemeral-storage' },
        { name: 'WebSockets', url: '/guides/functions/websockets' },
        { name: 'Custom Routing', url: '/guides/functions/routing' },
        { name: 'Wasm Modules', url: '/guides/functions/wasm' },
        { name: 'AI Models', url: '/guides/functions/ai-models' },
      ],
    },
    {
      name: 'Examples',
      url: undefined,
      items: [
        {
          name: 'Auth Send Email Hook',
          url: '/guides/functions/examples/auth-send-email-hook-react-email-resend',
        },
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
        {
          name: 'Image Transformation & Optimization',
          url: '/guides/functions/examples/image-manipulation',
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
          name: 'React Email',
          url: '/guides/functions/examples/auth-send-email-hook-react-email-resend',
        },
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
        {
          name: 'Text To Speech with ElevenLabs',
          url: '/guides/functions/examples/elevenlabs-generate-speech-stream',
        },
        {
          name: 'Speech Transcription with ElevenLabs',
          url: '/guides/functions/examples/elevenlabs-transcribe-speech',
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
        { name: 'Pricing', url: '/guides/realtime/pricing' },
        { name: 'Architecture', url: '/guides/realtime/architecture' },
        { name: 'Message Protocol', url: '/guides/realtime/protocol', items: [] },
        { name: 'Benchmarks', url: '/guides/realtime/benchmarks' },
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
        { name: 'Pricing', url: '/guides/storage/management/pricing' },
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
      name: 'Analytics Buckets',
      url: undefined,
      items: [
        { name: 'Introduction', url: '/guides/storage/analytics/introduction' },
        {
          name: 'Creating Analytics Buckets',
          url: '/guides/storage/analytics/creating-analytics-buckets',
        },
        {
          name: 'Connecting to Analytics Buckets',
          url: '/guides/storage/analytics/connecting-to-analytics-bucket',
        },
        {
          name: 'Limits',
          url: '/guides/storage/analytics/limits',
        },
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
          name: 'Automatic embeddings',
          url: '/guides/ai/automatic-embeddings',
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
        {
          name: 'Mixpeek',
          url: '/guides/ai/examples/mixpeek-video-search',
        },
      ],
    },
  ],
}

export const local_development: NavMenuConstant = {
  icon: 'dev-cli',
  title: 'Local Dev / CLI',
  url: '/guides/local-development',
  items: [
    { name: 'Overview', url: '/guides/local-development' },
    {
      name: 'CLI',
      url: undefined,
      items: [
        { name: 'Getting started', url: '/guides/local-development/cli/getting-started' },
        { name: 'Configuration', url: '/guides/local-development/cli/config' },
        { name: 'CLI commands', url: '/reference/cli' },
      ],
    },
    {
      name: 'Local development',
      url: undefined,
      items: [
        { name: 'Getting started', url: '/guides/local-development/overview' },
        {
          name: 'Declarative database schemas',
          url: '/guides/local-development/declarative-database-schemas',
        },
        {
          name: 'Seeding your database',
          url: '/guides/local-development/seeding-your-database',
        },
        {
          name: 'Managing config and secrets',
          url: '/guides/local-development/managing-config',
        },
        {
          name: 'Restoring downloaded backup',
          url: '/guides/local-development/restoring-downloaded-backup',
        },
        {
          name: 'Customizing email templates',
          url: '/guides/local-development/customizing-email-templates',
        },
      ],
    },
    {
      name: 'Testing',
      url: undefined,
      items: [
        { name: 'Getting started', url: '/guides/local-development/testing/overview' },
        {
          name: 'pgTAP advanced guide',
          url: '/guides/local-development/testing/pgtap-extended',
        },
        { name: 'Database testing', url: '/guides/database/testing' },
        {
          name: 'RLS policies testing',
          url: '/guides/database/extensions/pgtap#testing-rls-policies',
        },
      ],
    },
  ],
}

export const contributing: NavMenuConstant = {
  icon: 'contributing',
  title: 'Contributing',
  url: '/contributing',
  items: [{ name: 'Overview', url: '/contributing' }],
}

export const MIGRATION_PAGES: Partial<NavMenuSection & ComponentProps<typeof IconPanel>>[] = [
  {
    name: 'Auth0',
    icon: '/docs/img/icons/auth0-icon',
    url: '/guides/platform/migrating-to-supabase/auth0',
    hasLightIcon: true,
  },
  {
    name: 'Firebase Auth',
    icon: '/docs/img/icons/firebase-icon',
    url: '/guides/platform/migrating-to-supabase/firebase-auth',
  },
  {
    name: 'Firestore Data',
    icon: '/docs/img/icons/firebase-icon',
    url: '/guides/platform/migrating-to-supabase/firestore-data',
  },
  {
    name: 'Firebase Storage',
    icon: '/docs/img/icons/firebase-icon',
    url: '/guides/platform/migrating-to-supabase/firebase-storage',
  },
  {
    name: 'Heroku',
    icon: '/docs/img/icons/heroku-icon',
    url: '/guides/platform/migrating-to-supabase/heroku',
  },
  {
    name: 'Render',
    icon: '/docs/img/icons/render-icon',
    url: '/guides/platform/migrating-to-supabase/render',
  },
  {
    name: 'Amazon RDS',
    icon: '/docs/img/icons/aws-rds-icon',
    url: '/guides/platform/migrating-to-supabase/amazon-rds',
  },
  {
    name: 'Postgres',
    icon: '/docs/img/icons/postgres-icon',
    url: '/guides/platform/migrating-to-supabase/postgres',
  },
  {
    name: 'Vercel Postgres',
    icon: '/docs/img/icons/vercel-icon',
    url: '/guides/platform/migrating-to-supabase/vercel-postgres',
    hasLightIcon: true,
  },
  {
    name: 'Neon',
    icon: '/docs/img/icons/neon-icon',
    url: '/guides/platform/migrating-to-supabase/neon',
    hasLightIcon: true,
  },
  {
    name: 'MySQL',
    icon: '/docs/img/icons/mysql-icon',
    url: '/guides/platform/migrating-to-supabase/mysql',
  },
  {
    name: 'MSSQL',
    icon: '/docs/img/icons/mssql-icon',
    url: '/guides/platform/migrating-to-supabase/mssql',
  },
]

export const security: NavMenuConstant = {
  icon: 'security',
  title: 'Security',
  url: '/guides/security',
  items: [
    { name: 'Overview', url: '/guides/security' },
    {
      name: 'Product security',
      url: undefined,
      items: [
        { name: 'Platform configuration', url: '/guides/security/platform-security' },
        { name: 'Product configuration', url: '/guides/security/product-security' },
        { name: 'Security testing', url: '/guides/security/security-testing' },
      ],
    },
    {
      name: 'Compliance',
      url: undefined,
      items: [
        { name: 'SOC 2', url: '/guides/security/soc-2-compliance' },
        { name: 'HIPAA', url: '/guides/security/hipaa-compliance' },
      ],
    },
    {
      name: 'Guides',
      url: undefined,
      items: [
        { name: 'Production Checklist', url: '/guides/deployment/going-into-prod' },
        {
          name: 'Shared Responsibility Model',
          url: '/guides/deployment/shared-responsibility-model',
        },
        { name: 'Row Level Security', url: '/guides/database/postgres/row-level-security' },
        { name: 'Hardening the Data API', url: '/guides/database/hardening-data-api' },
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
        { name: 'Custom Domains', url: '/guides/platform/custom-domains' },
        { name: 'Database Backups', url: '/guides/platform/backups' },
        { name: 'IPv4 Address', url: '/guides/platform/ipv4-address' },
        { name: 'Read Replicas', url: '/guides/platform/read-replicas' },
      ],
    },
    {
      name: 'Upgrades & Migrations',
      url: undefined,
      items: [
        { name: 'Upgrading', url: '/guides/platform/upgrading' },
        {
          name: 'Migrating within Supabase',
          url: '/guides/platform/migrating-within-supabase',
          items: [
            {
              name: 'Restore Dashboard backup',
              url: '/guides/platform/migrating-within-supabase/dashboard-restore',
            },
            {
              name: 'Backup and restore using CLI',
              url: '/guides/platform/migrating-within-supabase/backup-restore',
            },
          ],
        },
        {
          name: 'Migrating to Supabase',
          url: '/guides/platform/migrating-to-supabase',
          items: MIGRATION_PAGES,
        },
      ],
    },
    {
      name: 'Project & Account Management',
      url: undefined,
      items: [
        {
          name: 'Access Control',
          url: '/guides/platform/access-control',
        },
        {
          name: 'Multi-factor Authentication',
          url: '/guides/platform/multi-factor-authentication',
          items: [
            {
              name: 'Enforce MFA on organization',
              url: '/guides/platform/mfa/org-mfa-enforcement',
            },
          ],
        },
        {
          name: 'Transfer Project',
          url: '/guides/platform/project-transfer',
        },
        {
          name: 'Single Sign-On',
          url: '/guides/platform/sso',
          items: [
            { name: 'SSO with Azure AD', url: '/guides/platform/sso/azure' },
            {
              name: 'SSO with Google Workspace',
              url: '/guides/platform/sso/gsuite',
            },
            { name: 'SSO with Okta', url: '/guides/platform/sso/okta' },
          ],
        },
      ],
    },
    {
      name: 'Platform Configuration',
      url: undefined,
      items: [
        { name: 'Regions', url: '/guides/platform/regions' },
        { name: 'Compute and Disk', url: '/guides/platform/compute-and-disk' },
        { name: 'Database Size', url: '/guides/platform/database-size' },
        { name: 'HIPAA Projects', url: '/guides/platform/hipaa-projects' },
        {
          name: 'Network Restrictions',
          url: '/guides/platform/network-restrictions',
        },
        { name: 'Performance Tuning', url: '/guides/platform/performance' },
        { name: 'SSL Enforcement', url: '/guides/platform/ssl-enforcement' },
        { name: 'Default Platform Permissions', url: '/guides/platform/permissions' },
        { name: 'PrivateLink', url: '/guides/platform/privatelink' },
      ],
    },
    {
      name: 'Billing',
      url: undefined,
      items: [
        {
          name: 'About billing on Supabase',
          url: '/guides/platform/billing-on-supabase',
        },
        {
          name: 'Get set up for billing',
          url: '/guides/platform/get-set-up-for-billing',
        },
        {
          name: 'Manage your subscription',
          url: '/guides/platform/manage-your-subscription',
        },
        {
          name: 'Manage your usage',
          url: '/guides/platform/manage-your-usage',
          items: [
            {
              name: 'Compute',
              url: '/guides/platform/manage-your-usage/compute',
            },
            {
              name: 'Egress',
              url: '/guides/platform/manage-your-usage/egress',
            },
            {
              name: 'Disk Size',
              url: '/guides/platform/manage-your-usage/disk-size',
            },
            {
              name: 'Disk Throughput',
              url: '/guides/platform/manage-your-usage/disk-throughput',
            },
            {
              name: 'Disk IOPS',
              url: '/guides/platform/manage-your-usage/disk-iops',
            },
            {
              name: 'Monthly Active Users',
              url: '/guides/platform/manage-your-usage/monthly-active-users',
            },
            {
              name: 'Monthly Active Third-Party Users',
              url: '/guides/platform/manage-your-usage/monthly-active-users-third-party',
            },
            {
              name: 'Monthly Active SSO Users',
              url: '/guides/platform/manage-your-usage/monthly-active-users-sso',
            },
            {
              name: 'Storage Size',
              url: '/guides/platform/manage-your-usage/storage-size',
            },
            {
              name: 'Storage Image Transformations',
              url: '/guides/platform/manage-your-usage/storage-image-transformations',
            },
            {
              name: 'Edge Function Invocations',
              url: '/guides/platform/manage-your-usage/edge-function-invocations',
            },
            {
              name: 'Realtime Messages',
              url: '/guides/platform/manage-your-usage/realtime-messages',
            },
            {
              name: 'Realtime Peak Connections',
              url: '/guides/platform/manage-your-usage/realtime-peak-connections',
            },
            {
              name: 'Custom Domains',
              url: '/guides/platform/manage-your-usage/custom-domains',
            },
            {
              name: 'Point-in-Time Recovery',
              url: '/guides/platform/manage-your-usage/point-in-time-recovery',
            },
            {
              name: 'IPv4',
              url: '/guides/platform/manage-your-usage/ipv4',
            },
            {
              name: 'MFA Phone',
              url: '/guides/platform/manage-your-usage/advanced-mfa-phone',
            },
            {
              name: 'Read Replicas',
              url: '/guides/platform/manage-your-usage/read-replicas',
            },
            {
              name: 'Branching',
              url: '/guides/platform/manage-your-usage/branching',
            },
            {
              name: 'Log Drains',
              url: '/guides/platform/manage-your-usage/log-drains',
            },
          ],
        },
        {
          name: 'Your monthly invoice',
          url: '/guides/platform/your-monthly-invoice',
        },
        {
          name: 'Control your costs',
          url: '/guides/platform/cost-control',
        },
        {
          name: 'Credits',
          url: '/guides/platform/credits',
        },
        {
          name: 'Billing FAQ',
          url: '/guides/platform/billing-faq',
        },
      ],
    },
  ],
}

export const telemetry: NavMenuConstant = {
  icon: 'telemetry',
  title: 'Telemetry',
  url: '/guides/telemetry',
  items: [
    { name: 'Overview', url: '/guides/telemetry' },
    {
      name: 'Logging & observability',
      url: undefined,
      items: [
        {
          name: 'Logging',
          url: '/guides/telemetry/logs',
        },
        {
          name: 'Advanced log filtering',
          url: '/guides/telemetry/advanced-log-filtering',
        },
        {
          name: 'Log drains',
          url: '/guides/telemetry/log-drains',
        },
        {
          name: 'Reports',
          url: '/guides/telemetry/reports',
        },
        {
          name: 'Metrics',
          url: '/guides/telemetry/metrics',
        },
        {
          name: 'Sentry integration',
          url: '/guides/telemetry/sentry-monitoring',
        },
      ],
    },
  ],
}

export const resources: NavMenuConstant = {
  icon: 'resources',
  title: 'Resources',
  url: '/guides/resources',
  items: [{ name: 'Glossary', url: '/guides/resources/glossary' }],
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

export const deployment: NavMenuConstant = {
  title: 'Deployment',
  url: '/guides/deployment',
  icon: 'deployment',
  items: [
    { name: 'Overview', url: '/guides/deployment' },
    {
      name: 'Environments',
      items: [
        { name: 'Managing environments', url: '/guides/deployment/managing-environments' },
        { name: 'Database migrations', url: '/guides/deployment/database-migrations' },
      ],
    },
    {
      name: 'Branching',
      url: undefined,
      items: [
        { name: 'Overview', url: '/guides/deployment/branching' },
        { name: 'GitHub integration', url: '/guides/deployment/branching/github-integration' },
        {
          name: 'Branching 2.0 (Alpha)',
          url: '/guides/deployment/branching/branching-2',
        },
        {
          name: 'Working with branches',
          url: '/guides/deployment/branching/working-with-branches',
        },
        { name: 'Configuration', url: '/guides/deployment/branching/configuration' },
        { name: 'Integrations', url: '/guides/deployment/branching/integrations' },
        { name: 'Troubleshooting', url: '/guides/deployment/branching/troubleshooting' },
        { name: 'Billing', url: '/guides/platform/manage-your-usage/branching' },
      ],
    },
    {
      name: 'Terraform',
      items: [
        { name: 'Terraform provider', url: '/guides/deployment/terraform' },
        { name: 'Terraform tutorial', url: '/guides/deployment/terraform/tutorial' },
        { name: 'Terraform reference', url: '/guides/deployment/terraform/reference' },
      ],
    },
    {
      name: 'Production readiness',
      items: [
        {
          name: 'Shared responsibility model',
          url: '/guides/deployment/shared-responsibility-model',
        },
        { name: 'Maturity model', url: '/guides/deployment/maturity-model' },
        { name: 'Production checklist', url: '/guides/deployment/going-into-prod' },
        { name: 'SOC 2 compliance', url: '/guides/security/soc-2-compliance' },
      ],
    },
    {
      name: 'CI/CD',
      items: [
        {
          name: 'Generate types from your database',
          url: '/guides/deployment/ci/generating-types',
        },
        { name: 'Automated testing', url: '/guides/deployment/ci/testing' },
        { name: 'Back up your database', url: '/guides/deployment/ci/backups' },
      ],
    },
  ],
}

export const integrations: NavMenuConstant = {
  title: 'Integrations',
  icon: 'integrations',
  url: '/guides/integrations',
  items: [
    {
      name: 'Overview',
      url: '/guides/integrations',
    },
    {
      name: 'Vercel Marketplace',
      url: '/guides/integrations/vercel-marketplace',
    },
    {
      name: 'Supabase Marketplace',
      url: '/guides/integrations/supabase-marketplace',
    },
    {
      name: 'Build Your Own',
      url: undefined,
      items: [
        {
          name: 'Build a Supabase integration',
          url: '/guides/integrations/build-a-supabase-integration',
          items: [
            {
              name: 'OAuth scopes',
              url: '/guides/integrations/build-a-supabase-integration/oauth-scopes',
            },
          ],
        },
      ],
    },
    { name: 'Integrations', url: undefined, items: [] },
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
  pkg: {
    name: '@supabase/supabase-js',
    repo: 'https://github.com/supabase/supabase-js',
  },
}

export const reference_javascript_v2 = {
  icon: 'reference-javascript',
  title: 'JavaScript',
  url: '/guides/reference/javascript',
  parent: '/reference',
  pkg: {
    name: '@supabase/supabase-js',
    repo: 'https://github.com/supabase/supabase-js',
  },
}

export const reference_dart_v1 = {
  icon: 'reference-dart',
  title: 'Flutter',
  url: '/guides/reference/dart',
  parent: '/reference',
  pkg: {
    name: 'supabase_flutter',
    repo: 'https://github.com/supabase/supabase-flutter',
  },
}

export const reference_dart_v2 = {
  icon: 'reference-dart',
  title: 'Flutter',
  url: '/guides/reference/dart',
  parent: '/reference',
  pkg: {
    name: 'supabase_flutter',
    repo: 'https://github.com/supabase/supabase-flutter',
  },
}

export const reference_csharp_v0 = {
  icon: 'reference-csharp',
  title: 'C#',
  url: 'guides/reference/csharp',
  parent: '/reference',
  pkg: {
    name: 'supabase',
    repo: 'https://github.com/supabase-community/supabase-csharp',
  },
}

export const reference_csharp_v1 = {
  icon: 'reference-csharp',
  title: 'C#',
  url: 'guides/reference/csharp',
  parent: '/reference',
  pkg: {
    name: 'supabase',
    repo: 'https://github.com/supabase-community/supabase-csharp',
  },
}

export const reference_python_v2 = {
  icon: 'reference-python',
  title: 'Python',
  url: '/guides/reference/python',
  parent: '/reference',
  pkg: {
    name: 'supabase-py',
    repo: 'https://github.com/supabase/supabase-py',
  },
}

export const reference_swift_v1 = {
  icon: 'reference-swift',
  title: 'swift',
  url: 'guides/reference/swift',
  parent: '/reference',
  pkg: {
    name: 'supabase-swift',
    repo: 'https://github.com/supabase/supabase-swift',
  },
}

export const reference_swift_v2 = {
  icon: 'reference-swift',
  title: 'swift',
  url: 'guides/reference/swift',
  parent: '/reference',
  pkg: {
    name: 'supabase-swift',
    repo: 'https://github.com/supabase/supabase-swift',
  },
}

export const reference_kotlin_v1 = {
  icon: 'reference-kotlin',
  title: 'kotlin',
  url: 'guides/reference/kotlin',
  parent: '/reference',
  pkg: {
    name: '@supabase-community/supabase-kt',
    repo: 'https://github.com/supabase-community/supabase-kt',
  },
}

export const reference_kotlin_v2 = {
  icon: 'reference-kotlin',
  title: 'kotlin',
  url: 'guides/reference/kotlin',
  parent: '/reference',
  pkg: {
    name: '@supabase-community/supabase-kt',
    repo: 'https://github.com/supabase-community/supabase-kt',
  },
}

export const reference_kotlin_v3 = {
  icon: 'reference-kotlin',
  title: 'kotlin',
  url: 'guides/reference/kotlin',
  parent: '/reference',
  pkg: {
    name: '@supabase-community/supabase-kt',
    repo: 'https://github.com/supabase-community/supabase-kt',
  },
}

export const reference_cli = {
  icon: 'reference-cli',
  title: 'Supabase CLI',
  url: '/guides/reference/cli',
  parent: '/',
  pkg: {
    name: 'supabase',
    repo: 'https://github.com/supabase/cli',
  },
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
        versions: ['v3', 'v2', 'v1'],
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
  migrationPages: MIGRATION_PAGES,
  nativeMobileLoginItems: NativeMobileLoginItems,
  phoneLoginsItems: PhoneLoginsItems,
  socialLoginItems: SocialLoginItems,
  ormQuickstarts,
  guiQuickstarts,
}
