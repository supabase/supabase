// import SupabaseJsV1Nav from 'data/nav/supabase-js/v1'
// import SupabaseJsV2Nav from 'data/nav/supabase-js/v2'
// import SupabaseDartV0Nav from 'data/nav/supabase-dart/v0'
// import SupabaseDartV1Nav from 'data/nav/supabase-dart/v1'
// import SupabaseCLINav from 'data/nav/supabase-cli'
// import SupabaseAPINav from 'data/nav/supabase-api'
// import AuthServerNav from 'data/nav/auth-server'
// import StorageServerNav from 'data/nav/storage-server'

import { NavMenu, References } from '../Navigation.types'

export const REFERENCES: References = {
  javascript: {
    name: 'supabase-js',
    library: 'supabase-js',
    versions: ['v2', 'v1'],
    icon: '/docs/img/libraries/javascript-icon.svg',
  },
  dart: {
    name: 'Flutter',
    library: 'supabase-dart',
    versions: ['v1', 'v0'],
    icon: '/docs/img/libraries/flutter-icon.svg',
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

export const gettingstarted = {
  icon: '/img/icons/menu/getting-started.svg',
  title: 'Getting started',
  label: 'Overview',
  items: [
    { name: 'Introduction', url: '/', items: [] },
    { name: 'Features', url: '/features', items: [] },
    { name: 'Architecture', url: '/architecture', items: [] },
  ],
}

export const tutorials = {
  icon: '/img/icons/menu/tutorials.svg',
  label: 'Quickstarts',
  items: [
    {
      name: 'Javascript',
      items: [
        {
          name: 'React',
          url: '/guides/tutorials/with-react',
          items: [],
          icon: '/img/icons/react-icon.svg',
        },
        {
          name: 'Next.js',
          url: '/guides/tutorials/with-nextjs',
          items: [],
        },
        {
          name: 'Angular',
          url: '/guides/tutorials/with-angular',
          items: [],
        },
        {
          name: 'Nuxt 3',
          url: '/guides/tutorials/with-nuxt-3',
          items: [],
        },
        {
          name: 'RedwoodJS',
          url: '/guides/tutorials/with-redwoodjs',
          items: [],
        },
        {
          name: 'SolidJS',
          url: '/guides/tutorials/with-solidjs',
          items: [],
        },
        {
          name: 'Svelte',
          url: '/guides/tutorials/with-svelte',
          items: [],
        },
        {
          name: 'SvelteKit',
          url: '/guides/tutorials/with-sveltekit',
          items: [],
        },
        {
          name: 'Vue 3',
          url: '/guides/tutorials/with-vue-3',
          items: [],
        },
      ],
    },
    {
      name: 'Mobile based',
      items: [
        {
          name: 'Flutter',
          url: '/guides/tutorials/with-flutter',
          items: [],
        },
        {
          name: 'Expo',
          url: '/guides/tutorials/with-expo',
          items: [],
        },
      ],
    },
    {
      name: 'Low code',
      items: [
        {
          name: 'Ionic Angular',
          url: '/guides/tutorials/with-ionic-angular',
          items: [],
        },
        {
          name: 'Ionic React',
          url: '/guides/tutorials/with-ionic-react',
          items: [],
        },
        {
          name: 'Ionic Vue',
          url: '/guides/tutorials/with-ionic-vue',
          items: [],
        },
      ],
    },
  ],
}
export const cli = {
  label: 'CLI',
  items: [
    { name: 'Overview', url: '/guides/cli', items: [] },
    { name: 'Local Development', url: '/guides/cli/local-development', items: [] },
    { name: 'Managing Environments', url: '/guides/cli/managing-environments', items: [] },
  ],
}

export const SocialLoginItems = [
  {
    name: 'Apple login',
    icon: '/docs/img/icons/apple-icon',
    url: '/guides/auth/auth-apple',
    items: [],
  },
  {
    name: 'Azure login',
    icon: '/docs/img/icons/microsoft-icon',
    url: '/guides/auth/auth-azure',
    items: [],
  },
  {
    name: 'Bitbucket login',
    icon: '/docs/img/icons/bitbucket-icon',
    url: '/guides/auth/auth-bitbucket',
    items: [],
  },
  {
    name: 'Discord login',
    icon: '/docs/img/icons/discord-icon',
    url: '/guides/auth/auth-discord',
    items: [],
  },
  {
    name: 'Facebook login',
    icon: '/docs/img/icons/facebook-icon',
    url: '/guides/auth/auth-facebook',
    items: [],
  },
  {
    name: 'GitHub login',
    icon: '/docs/img/icons/github-icon',
    url: '/guides/auth/auth-github',
    items: [],
    isDarkMode: true,
  },
  {
    name: 'Gitlab login',
    icon: '/docs/img/icons/gitlab-icon',
    url: '/guides/auth/auth-gitlab',
    items: [],
  },
  {
    name: 'Google login',
    icon: '/docs/img/icons/google-icon',
    url: '/guides/auth/auth-google',
    items: [],
  },
  {
    name: 'Keycloak login',
    icon: '/docs/img/icons/keycloak-icon',
    url: '/guides/auth/auth-keycloak',
    items: [],
  },
  {
    name: 'LinkedIn login',
    icon: '/docs/img/icons/linkedin-icon',
    url: '/guides/auth/auth-linkedin',
    items: [],
  },
  {
    name: 'Notion login',
    icon: '/docs/img/icons/notion-icon',
    url: '/guides/auth/auth-notion',
    items: [],
  },
  {
    name: 'Slack login',
    icon: '/docs/img/icons/slack-icon',
    url: '/guides/auth/auth-slack',
    items: [],
  },
  {
    name: 'Spotify login',
    icon: '/docs/img/icons/spotify-icon',
    url: '/guides/auth/auth-spotify',
    items: [],
  },
  {
    name: 'Twitch login',
    icon: '/docs/img/icons/twitch-icon',
    url: '/guides/auth/auth-twitch',
    items: [],
  },
  {
    name: 'Twitter login',
    icon: '/docs/img/icons/twitter-icon',
    url: '/guides/auth/auth-twitter',
    items: [],
  },
  {
    name: 'WorkOS login',
    icon: '/docs/img/icons/workos-icon',
    url: '/guides/auth/auth-workos',
    items: [],
  },
]

export const PhoneLogins = [
  {
    name: 'Twilio login',
    icon: '/docs/img/icons/twilio-icon',
    url: '/guides/auth/auth-twilio',
    items: [],
  },
  {
    name: 'Vonage login',
    icon: '/docs/img/icons/vonage-icon',
    url: '/guides/auth/auth-vonage',
    items: [],
  },
  {
    name: 'MessageBird login',
    icon: '/docs/img/icons/messagebird-icon',
    url: '/guides/auth/auth-messagebird',
    items: [],
  },
]

export const auth = {
  icon: '/img/icons/menu/auth.svg',
  label: 'Auth',
  items: [
    {
      name: 'Overview',
      url: '/guides/auth/overview',
    },
    {
      name: 'Authentication',
      url: undefined,
      items: [
        { name: 'Email login', url: '/guides/auth/auth-email', items: [] },
        { name: 'Magic Link login', url: '/guides/auth/auth-magic-link', items: [] },
        {
          name: '0Auth Login',
          url: '/guides/auth/0auth-login',
          items: [...SocialLoginItems],
        },
        { name: 'Phone Login', url: '/guides/auth/phone-login', items: [] },
      ],
    },
    {
      name: 'Authorization',
      url: undefined,
      items: [
        { name: 'Row Level Security', url: '/guides/auth/row-level-security', items: [] },
        { name: 'Managing User Data', url: '/guides/auth/managing-user-data', items: [] },
        { name: 'Enable Captcha Protection', url: '/guides/auth/auth-captcha', items: [] },
        { name: 'Server-side Rendering', url: '/guides/auth/server-side-rendering', items: [] },
        { name: 'Multi-Factor Authentication', url: '/guides/auth/auth-mfa', items: [] },
      ],
    },
    {
      name: 'Auth Helpers',
      url: undefined,
      items: [
        { name: 'Overview', url: '/guides/auth/auth-helpers', items: [] },
        { name: 'Auth UI', url: '/guides/auth/auth-helpers/auth-ui', items: [] },
        { name: 'Next.js', url: '/guides/auth/auth-helpers/nextjs', items: [] },
        { name: 'SvelteKit', url: '/guides/auth/auth-helpers/sveltekit', items: [] },
        { name: 'Remix', url: '/guides/auth/auth-helpers/remix', items: [] },
      ],
    },
    {
      name: 'Deep Dive',
      url: undefined,
      items: [
        {
          name: 'Part One: JWTs',
          url: '/learn/auth-deep-dive/auth-deep-dive-jwts',
          items: [],
        },
        {
          name: 'Part Two: Row Level Security',
          url: '/learn/auth-deep-dive/auth-row-level-security',
          items: [],
        },
        { name: 'Part Three: Policies', url: '/learn/auth-deep-dive/auth-policies', items: [] },
        { name: 'Part Four: GoTrue', url: '/learn/auth-deep-dive/auth-gotrue', items: [] },
        {
          name: 'Part Five: Google OAuth',
          url: '/learn/auth-deep-dive/auth-google-oauth',
          items: [],
        },
      ],
    },
  ],
  extras: [
    {
      name: 'API Reference',
      level: 'integrations',
      items: [],
      icon: '/img/icons/menu/reference.svg',
    },
    {
      name: 'Integrations',
      level: 'reference',
      items: [],
      icon: '/img/icons/menu/integrations.svg',
    },
  ],
}

export const database = {
  icon: '/img/icons/menu/database.svg',
  label: 'Database',
  items: [
    { name: 'Overview', url: '/guides/database', items: [] },
    { name: 'Database Connections', url: '/guides/database/connecting-to-postgres', items: [] },
    { name: 'Tables and Data', url: '/guides/database/tables', items: [] },
    { name: 'Database Functions', url: '/guides/database/functions', items: [] },
    { name: 'Database Webhooks', url: '/guides/database/database-webhooks', items: [] },
    { name: 'Full Text Search', url: '/guides/database/full-text-search', items: [] },
    { name: 'Database Testing', url: '/guides/database/testing', items: [] },
    {
      name: 'Serverless APIs',
      url: undefined,
      items: [
        { name: 'Overview', url: '/guides/api', items: [] },
        { name: 'Generating Types', url: '/guides/api/generating-types', items: [] },
      ],
    },
    {
      name: 'Extensions',
      url: undefined,
      items: [
        { name: 'Overview', url: '/guides/database/extensions', items: [] },
        {
          name: 'plv8: Javascript Language',
          url: '/guides/database/extensions/plv8',
          items: [],
        },
        { name: 'http: RESTful Client', url: '/guides/database/extensions/http', items: [] },
        {
          name: 'pg_cron: Job Scheduling',
          url: '/guides/database/extensions/pgcron',
          items: [],
        },
        {
          name: 'pg_net: Async Networking',
          url: '/guides/database/extensions/pgnet',
          items: [],
        },
        { name: 'pgTAP: Unit Testing', url: '/guides/database/extensions/pgtap', items: [] },
        {
          name: 'uuid-ossp: Unique Identifiers',
          url: '/guides/database/extensions/uuid-ossp',
          items: [],
        },
      ],
    },
    {
      name: 'Configuration',
      url: undefined,
      items: [
        { name: 'Timeouts', url: '/guides/database/timeouts', items: [] },
        { name: 'Replication', url: '/guides/database/replication', items: [] },
        { name: 'Passwords', url: '/guides/database/managing-passwords', items: [] },
        { name: 'Timezones', url: '/guides/database/managing-timezones', items: [] },
      ],
    },
  ],
}

export const functions = {
  icon: '/img/icons/menu/functions.svg',
  label: 'Edge Functions',
  items: [
    { name: 'Overview', url: '/guides/functions', items: [] },
    { name: 'Auth', url: '/guides/functions/auth', items: [] },
    { name: 'CI/CD Workflow', url: '/guides/functions/cicd-workflow', items: [] },
    {
      name: 'Examples',
      url: '/guides/functions/examples',
      items: [
        { name: 'Overview', url: '/guides/functions/examples', items: [] },
        { name: 'OG Image', url: '/guides/functions/examples/og-image', items: [] },
      ],
    },
  ],
}

export const realtime = {
  icon: '/img/icons/menu/realtime.svg',
  label: 'Realtime',
  items: [
    { name: 'Overview', url: '/guides/realtime', items: [] },
    { name: 'Quickstart', url: '/guides/realtime/quickstart', items: [] },
    {
      name: 'Channels',
      url: undefined,
      items: [
        { name: 'Postgres CDC', url: '/guides/realtime/postgres-cdc', items: [] },
        { name: 'Rate Limits', url: '/guides/realtime/rate-limits', items: [] },
      ],
    },
  ],
}

export const storage = {
  icon: '/img/icons/menu/storage.svg',
  label: 'Storage',
  items: [
    { name: 'Overview', url: '/guides/storage', items: [] },
    { name: 'CDN', url: '/guides/storage-cdn', items: [] },
  ],
}

export const platform = {
  icon: '/img/icons/menu/platform.svg',
  label: 'Platform',
  items: [
    { name: 'Overview', url: '/guides/hosting/platform', items: [] },
    { name: 'Custom Domains', url: '/guides/platform/custom-domains', items: [] },
    { name: 'Database Usage', url: '/guides/platform/database-usage', items: [] },
    { name: 'Logging', url: '/guides/platform/logs', items: [] },
    { name: 'Metrics', url: '/guides/platform/metrics', items: [] },
    {
      name: 'Migrating and upgrading',
      url: '/guides/platform/migrating-and-upgrading-projects',
      items: [],
    },
    { name: 'Performance Tuning', url: '/guides/platform/performance', items: [] },
    { name: 'Permissions', url: '/guides/platform/permissions', items: [] },
    { name: 'Production Readiness', url: '/guides/platform/going-into-prod', items: [] },
  ],
}

export const selfHosting = {
  label: 'Self Hosting',
  items: [
    { name: 'Overview', url: '/guides/hosting/overview', items: [] },
    { name: 'Docker', url: '/guides/hosting/docker', items: [] },
  ],
}

export const migrate = {
  label: 'Migrate to Supabase',
  items: [
    { name: 'Firebase Auth', url: '/guides/migrations/firebase-auth', items: [] },
    { name: 'Firestore Data', url: '/guides/migrations/firestore-data', items: [] },
    { name: 'Firebase Storage', url: '/guides/migrations/firebase-storage', items: [] },
    { name: 'Heroku', url: '/guides/migrations/heroku', items: [] },
  ],
}

export const integrations = {
  icon: '/img/icons/menu/integrations.svg',
  label: 'Integrations',
  items: [
    {
      name: 'Auth',
      url: undefined,
      items: [
        {
          name: 'Auth0',
          url: '/guides/integrations/auth0',
          items: [],
        },
        { name: 'Authsignal', url: '/guides/integrations/authsignal', items: [] },
        { name: 'Clerk', url: '/guides/integrations/clerk', items: [] },
        { name: 'keyri', url: '/guides/integrations/keyri', items: [] },
        { name: 'Stytch', url: '/guides/integrations/stytch', items: [] },
        { name: 'SuperTokens', url: '/guides/integrations/supertokens', items: [] },
      ],
    },
    {
      name: 'Caching / Offline-first',
      url: undefined,
      items: [{ name: 'Polyscale', url: '/guides/integrations/polyscale', items: [] }],
    },
    {
      name: 'Developer Tools',
      url: undefined,
      items: [
        { name: 'pgMustard', url: '/guides/integrations/pgmustard', items: [] },
        { name: 'Prisma', url: '/guides/integrations/prisma', items: [] },
        { name: 'Sequin', url: '/guides/integrations/sequin', items: [] },
        { name: 'Snaplet', url: '/guides/integrations/snaplet', items: [] },
        { name: 'Vercel', url: '/guides/integrations/vercel', items: [] },
      ],
    },
    {
      name: 'Low-code',
      url: undefined,
      items: [
        { name: 'Appsmith', url: '/guides/integrations/appsmith', items: [] },
        { name: 'Dashibase', url: '/guides/integrations/dashibase', items: [] },
        { name: 'DhiWise', url: '/guides/integrations/dhiwise', items: [] },
        { name: 'Directus', url: '/guides/integrations/directus', items: [] },
        { name: 'Draftbit', url: '/guides/integrations/draftbit', items: [] },
        { name: 'Plasmic', url: '/guides/integrations/plasmic', items: [] },
      ],
    },
    { name: 'Supabase Marketplace', url: '/guides/integrations/integrations', items: [] },
  ],
}

export const reference = {
  title: 'API Reference',
  icon: '/img/icons/menu/reference.svg',
  items: [
    {
      name: 'Client libraries',
      items: [
        {
          name: 'supabase-js',
          url: '/reference/javascript/start',
          level: 'reference_javascript',
          items: [],
          icon: '/img/icons/javascript.svg',
        },
        {
          name: 'supabase-dart',
          url: '/reference/dart/start',
          level: 'reference_dart',
          items: [],
          icon: '/img/icons/javascript.svg',
        },
        {
          name: 'supbase-python',
          url: '/reference/python/start',
          level: 'reference_python',
          items: [],
          icon: '/img/icons/javascript.svg',
        },
      ],
    },
    {
      name: 'Other tools',
      items: [
        {
          name: 'Supabase CLI',
          url: '/reference/cli/start',
          items: [],
          icon: '/img/icons/cli.svg',
        },
        {
          name: 'Management API',
          url: '/reference/javascript',
          items: [],
          icon: '/img/icons/javascript.svg',
        },
      ],
    },
  ],
}

export const reference_javascript = {
  icon: '/img/icons/javascript-icon.svg',
  title: 'javascript',
  parent: '/reference',
  items: [
    {
      name: 'Getting Started',
      items: [
        {
          name: 'fake link',
          href: '/reference/javascript/start',
          level: 'reference_javascript',
          items: [],
          icon: '/img/icons/javascript.svg',
        },
      ],
    },
  ],
}

export const reference_dart = {
  icon: '/img/icons/dart-icon.svg',
  title: 'dart',
  parent: '/reference',
  items: [
    {
      name: 'Getting Started',
      items: [
        {
          name: 'fake link',
          href: '/reference/dart/start',
          level: 'reference_dart',
          items: [],
          icon: '/img/icons/dart.svg',
        },
      ],
    },
  ],
}

export const reference_cli = {
  icon: '/img/icons/cli-icon.svg',
  title: 'Supabase CLI',
  parent: '/',
  items: [
    {
      name: 'Getting Started',
      items: [
        {
          name: 'fake link',
          href: '/reference/javascript/start',
          level: 'reference_javascript',
          items: [],
          icon: '/img/icons/javascript.svg',
        },
      ],
    },
  ],
}

// export const reference: [
//   {
//     label: 'Official'
//     items: [
//       { name: 'Reference Documentation'; url: '/reference'; items: [] },
//       { name: 'Supabase JavaScript Library'; url: '/reference/javascript'; items: [] },
//       { name: 'Supabase Flutter Library'; url: '/reference/dart'; items: [] },
//       { name: 'Supabase CLI'; url: '/reference/cli'; items: [] },
//       { name: 'Management API'; url: '/reference/api'; items: [] }
//     ]
//   },
//   {
//     label: 'Self-hosting'
//     items: [
//       { name: 'Auth Server'; url: '/reference/auth'; items: [] },
//       { name: 'Storage Server'; url: '/reference/storage'; items: [] }
//     ]
//   }
//     {
//       label: 'Clients',
//       items: [
//         { name: 'Auth Server', url: '/reference/auth', items: [] },
//         { name: 'Storage Server', url: '/reference/storage', items: [] },
//       ],
//     },
//   'reference/javascript': SupabaseJsV2Nav,
//   'reference/javascript/v1': SupabaseJsV1Nav,
//   'reference/dart': SupabaseDartV1Nav,
//   'reference/dart/v0': SupabaseDartV0Nav,
//   'reference/cli': SupabaseCLINav,
//   'reference/api': SupabaseAPINav,
//   'reference/auth': AuthServerNav,
//   'reference/storage': StorageServerNav,
// ]

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
    label: 'Self Hosting',
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
