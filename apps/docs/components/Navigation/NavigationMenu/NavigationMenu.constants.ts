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
    icon: '/img/libraries/javascript-icon',
  },
  dart: {
    name: 'Flutter',
    library: 'supabase-dart',
    versions: ['v1', 'v0'],
    icon: '/docs/img/libraries/flutter-icon.svg',
  },
  csharp: {
    name: 'C#',
    library: 'supabase-csharp',
    versions: ['v0'],
    icon: '/docs/img/libraries/c-sharp-icon.svg',
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
  icon: 'getting-started',
  title: 'Getting Started',
  items: [
    { name: 'Features', url: '/guides/getting-started/features', items: [] },
    { name: 'Architecture', url: '/guides/getting-started/architecture', items: [] },
    {
      name: 'Framework Quickstarts',
      items: [
        { name: 'ReactJS', url: '/guides/getting-started/quickstarts/reactjs', items: [] },
        { name: 'NextJS', url: '/guides/getting-started/quickstarts/nextjs', items: [] },
        { name: 'Flutter', url: '/guides/getting-started/quickstarts/flutter', items: [] },
        { name: 'SvelteKit', url: '/guides/getting-started/quickstarts/sveltekit', items: [] },
        { name: 'SolidJS', url: '/guides/getting-started/quickstarts/solidjs', items: [] },
        { name: 'Vue', url: '/guides/getting-started/quickstarts/vue', items: [] },
      ],
    },
    {
      name: 'Web app tutorials',
      items: [
        {
          name: 'Next.js',
          url: '/guides/getting-started/tutorials/with-nextjs',
          items: [],
        },
        {
          name: 'React',
          url: '/guides/getting-started/tutorials/with-react',
          items: [],
        },
        {
          name: 'Vue 3',
          url: '/guides/getting-started/tutorials/with-vue-3',
          items: [],
        },
        {
          name: 'Nuxt 3',
          url: '/guides/getting-started/tutorials/with-nuxt-3',
          items: [],
        },
        {
          name: 'Angular',
          url: '/guides/getting-started/tutorials/with-angular',
          items: [],
        },
        {
          name: 'RedwoodJS',
          url: '/guides/getting-started/tutorials/with-redwoodjs',
          items: [],
        },
        {
          name: 'SolidJS',
          url: '/guides/getting-started/tutorials/with-solidjs',
          items: [],
        },
        {
          name: 'Svelte',
          url: '/guides/getting-started/tutorials/with-svelte',
          items: [],
        },
        {
          name: 'SvelteKit',
          url: '/guides/getting-started/tutorials/with-sveltekit',
          items: [],
        },
      ],
    },
    {
      name: 'Mobile tutorials',
      items: [
        {
          name: 'Flutter',
          url: '/guides/getting-started/tutorials/with-flutter',
          items: [],
        },
        {
          name: 'Expo',
          url: '/guides/getting-started/tutorials/with-expo',
          items: [],
        },

        {
          name: 'Ionic React',
          url: '/guides/getting-started/tutorials/with-ionic-react',
          items: [],
        },
        {
          name: 'Ionic Vue',
          url: '/guides/getting-started/tutorials/with-ionic-vue',
          items: [],
        },
        {
          name: 'Ionic Angular',
          url: '/guides/getting-started/tutorials/with-ionic-angular',
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
    name: 'Google',
    icon: '/docs/img/icons/google-icon',
    url: '/guides/auth/social-login/auth-google',
    items: [],
  },
  {
    name: 'Facebook',
    icon: '/docs/img/icons/facebook-icon',
    url: '/guides/auth/social-login/auth-facebook',
    items: [],
  },
  {
    name: 'Apple',
    icon: '/docs/img/icons/apple-icon',
    url: '/guides/auth/social-login/auth-apple',
    items: [],
  },
  {
    name: 'Azure',
    icon: '/docs/img/icons/microsoft-icon',
    url: '/guides/auth/social-login/auth-azure',
    items: [],
  },
  {
    name: 'Twitter',
    icon: '/docs/img/icons/twitter-icon',
    url: '/guides/auth/social-login/auth-twitter',
    items: [],
  },
  {
    name: 'GitHub',
    icon: '/docs/img/icons/github-icon',
    url: '/guides/auth/social-login/auth-github',
    items: [],
    isDarkMode: true,
  },
  {
    name: 'Gitlab',
    icon: '/docs/img/icons/gitlab-icon',
    url: '/guides/auth/social-login/auth-gitlab',
    items: [],
  },
  {
    name: 'Bitbucket',
    icon: '/docs/img/icons/bitbucket-icon',
    url: '/guides/auth/social-login/auth-bitbucket',
    items: [],
  },
  {
    name: 'Discord',
    icon: '/docs/img/icons/discord-icon',
    url: '/guides/auth/social-login/auth-discord',
    items: [],
  },
  {
    name: 'Keycloak',
    icon: '/docs/img/icons/keycloak-icon',
    url: '/guides/auth/social-login/auth-keycloak',
    items: [],
  },
  {
    name: 'LinkedIn',
    icon: '/docs/img/icons/linkedin-icon',
    url: '/guides/auth/social-login/auth-linkedin',
    items: [],
  },
  {
    name: 'Notion',
    icon: '/docs/img/icons/notion-icon',
    url: '/guides/auth/social-login/auth-notion',
    items: [],
  },
  {
    name: 'Slack',
    icon: '/docs/img/icons/slack-icon',
    url: '/guides/auth/social-login/auth-slack',
    items: [],
  },
  {
    name: 'Spotify',
    icon: '/docs/img/icons/spotify-icon',
    url: '/guides/auth/social-login/auth-spotify',
    items: [],
  },
  {
    name: 'Twitch',
    icon: '/docs/img/icons/twitch-icon',
    url: '/guides/auth/social-login/auth-twitch',
    items: [],
  },
  {
    name: 'WorkOS',
    icon: '/docs/img/icons/workos-icon',
    url: '/guides/auth/social-login/auth-workos',
    items: [],
  },
  {
    name: 'Zoom',
    icon: '/docs/img/icons/zoom-icon',
    url: '/guides/auth/social-login/auth-zoom',
    items: [],
  },
]

export const PhoneLoginsItems = [
  {
    name: 'MessageBird SMS Login',
    icon: '/docs/img/icons/messagebird-icon',
    linkDescription: 'Communication between businesses and their customers — across any channel.',
    url: '/guides/auth/phone-login/messagebird',
    items: [],
  },
  {
    name: 'Twilio SMS Login',
    icon: '/docs/img/icons/twilio-icon',
    url: '/guides/auth/phone-login/twilio',
    linkDescription: 'Customer engagement platform used by hundreds of thousands of businesses.',
    items: [],
  },
  {
    name: 'Vonage SMS Login',
    icon: '/docs/img/icons/vonage-icon',
    url: '/guides/auth/phone-login/vonage',
    linkDescription:
      'Vonage is a communication platform as a service (CPaaS) provider for consumers and businesses.',
    items: [],
    isDarkMode: true,
  },
]

export const auth = {
  icon: 'auth',
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
        { name: 'Email Login', url: '/guides/auth/auth-email', items: [] },
        { name: 'Magic Link Login', url: '/guides/auth/auth-magic-link', items: [] },
        {
          name: 'Phone Login',
          url: '/guides/auth/phone-login',
          items: [...PhoneLoginsItems],
        },
        {
          name: 'Social Login',
          url: '/guides/auth/social-login',
          items: [...SocialLoginItems],
        },
        { name: 'Email Templates', url: '/guides/auth/auth-email-templates', items: [] },
      ],
    },
    {
      name: 'Authorization',
      url: undefined,
      items: [
        { name: 'Enable Captcha Protection', url: '/guides/auth/auth-captcha', items: [] },
        { name: 'Managing User Data', url: '/guides/auth/managing-user-data', items: [] },
        { name: 'Multi-Factor Authentication', url: '/guides/auth/auth-mfa', items: [] },
        { name: 'Row Level Security', url: '/guides/auth/row-level-security', items: [] },
        { name: 'Server-side Rendering', url: '/guides/auth/server-side-rendering', items: [] },
      ],
    },
    {
      name: 'Auth Helpers',
      url: undefined,
      items: [
        { name: 'Overview', url: '/guides/auth/auth-helpers', items: [] },
        { name: 'Auth UI', url: '/guides/auth/auth-helpers/auth-ui', items: [] },
        { name: 'Next.js', url: '/guides/auth/auth-helpers/nextjs', items: [] },
        {
          name: 'Next.js Server Components',
          url: '/guides/auth/auth-helpers/nextjs-server-components',
          items: [],
        },
        { name: 'Remix', url: '/guides/auth/auth-helpers/remix', items: [] },
        { name: 'SvelteKit', url: '/guides/auth/auth-helpers/sveltekit', items: [] },
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
}

export const database = {
  icon: 'database',
  label: 'Database',
  url: '/guides/database',
  items: [
    { name: 'Database Connections', url: '/guides/database/connecting-to-postgres', items: [] },
    { name: 'Tables and Data', url: '/guides/database/tables', items: [] },
    { name: 'Database Functions', url: '/guides/database/functions', items: [] },
    { name: 'Database Webhooks', url: '/guides/database/webhooks', items: [] },
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
          name: 'HypoPG: Hypothetical indexes',
          url: '/guides/database/extensions/hypopg',
          items: [],
        },
        {
          name: 'plv8: Javascript Language',
          url: '/guides/database/extensions/plv8',
          items: [],
        },
        { name: 'http: RESTful Client', url: '/guides/database/extensions/http', items: [] },
        {
          name: 'PGRoonga: Multilingual Full Text Search',
          url: '/guides/database/extensions/pgroonga',
          items: [],
        },
        {
          name: 'pg_cron: Job Scheduling',
          url: '/guides/database/extensions/pgcron',
          items: [],
        },
        {
          name: 'pg_jsonschema: JSON Schema Validation',
          url: '/guides/database/extensions/pg_jsonschema',
          items: [],
        },
        {
          name: 'pg_net: Async Networking',
          url: '/guides/database/extensions/pgnet',
          items: [],
        },
        {
          name: 'pg_stat_statements: SQL Planning and Execution Statistics',
          url: '/guides/database/extensions/pg_stat_statements',
          items: [],
        },
        {
          name: 'pg_repack: Storage Optimization',
          url: '/guides/database/extensions/pgrepack',
          items: [],
        },
        {
          name: 'PostGIS: Geo queries',
          url: '/guides/database/extensions/postgis',
          items: [],
        },
        { name: 'pgTAP: Unit Testing', url: '/guides/database/extensions/pgtap', items: [] },
        {
          name: 'uuid-ossp: Unique Identifiers',
          url: '/guides/database/extensions/uuid-ossp',
          items: [],
        },
        {
          name: 'RUM: inverted index for full-text search',
          url: '/guides/database/extensions/rum',
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
  icon: 'functions',
  label: 'Edge Functions',
  url: '/guides/functions',
  items: [
    { name: 'Quickstart', url: '/guides/functions/quickstart', items: [] },
    { name: 'Auth', url: '/guides/functions/auth', items: [] },
    { name: 'CI/CD Workflow', url: '/guides/functions/cicd-workflow', items: [] },
    { name: 'CORS', url: '/guides/functions/cors', items: [] },
    { name: 'Debugging', url: '/guides/functions/debugging', items: [] },
    { name: 'Import Maps', url: '/guides/functions/import-maps', items: [] },
    { name: 'Local Development', url: '/guides/functions/local-development', items: [] },
    { name: 'Managing Secrets', url: '/guides/functions/secrets', items: [] },
    { name: 'Schedule Functions', url: '/guides/functions/schedule-functions', items: [] },
    {
      name: 'Examples',
      url: '/guides/functions/examples',
      items: [
        {
          name: 'Cloudflare Turnstile',
          url: '/guides/functions/examples/cloudflare-turnstile',
          items: [],
        },
        {
          name: 'Connect to Postgres',
          url: '/guides/functions/examples/connect-to-postgres',
          items: [],
        },
        { name: 'GitHub Actions', url: '/guides/functions/examples/github-actions', items: [] },
        { name: 'OG Image', url: '/guides/functions/examples/og-image', items: [] },
        { name: 'Storage Caching', url: '/guides/functions/examples/storage-caching', items: [] },
        { name: 'Stripe Webhooks', url: '/guides/functions/examples/stripe-webhooks', items: [] },
        { name: 'Telegram Bot', url: '/guides/functions/examples/telegram-bot', items: [] },
      ],
    },
  ],
}

export const realtime = {
  icon: 'realtime',
  label: 'Realtime',
  url: '/guides/realtime',
  items: [
    { name: 'Overview', url: '/guides/realtime', items: [] },
    { name: 'Quickstart', url: '/guides/realtime/quickstart', items: [] },
    {
      name: 'Channels',
      url: undefined,
      items: [
        { name: 'Broadcast', url: '/guides/realtime/broadcast', items: [] },
        { name: 'Presence', url: '/guides/realtime/presence', items: [] },
        { name: 'Postgres Changes', url: '/guides/realtime/postgres-changes', items: [] },
        { name: 'Rate Limits', url: '/guides/realtime/rate-limits', items: [] },
      ],
    },
  ],
}

export const storage = {
  icon: 'storage',
  label: 'Storage',
  url: '/guides/storage',
  items: [
    { name: 'Overview', url: '/guides/storage', items: [] },
    { name: 'Quickstart', url: '/guides/storage/quickstart', items: [] },
    { name: 'Access Control', url: '/guides/storage/access-control', items: [] },
    { name: 'CDN', url: '/guides/storage/cdn', items: [] },
    { name: 'Image Transformations', url: '/guides/storage/image-transformations', items: [] },
  ],
}

export const supabase_cli = {
  icon: 'reference-cli',
  title: 'Supabase CLI',
  url: '/guides/cli',
  items: [
    { name: 'Overview', url: '/guides/cli', items: [] },
    { name: 'Local Development', url: '/guides/cli/local-development', items: [] },
    { name: 'Managing Environments', url: '/guides/cli/managing-environments', items: [] },
    {
      name: 'Reference',
      url: undefined,
      items: [
        { name: 'Commands', url: '/reference/cli/introduction', items: [] },
        { name: 'Configuration', url: '/reference/cli/config', items: [] },
      ],
    },
  ],
}

export const platform = {
  icon: 'platform',
  label: 'Platform',
  url: '/guides/platform',
  items: [
    {
      name: 'Add-ons',
      url: undefined,
      items: [
        { name: 'Compute Add-ons', url: '/guides/platform/compute-add-ons', items: [] },
        { name: 'Custom Domains', url: '/guides/platform/custom-domains', items: [] },
        { name: 'Database Backups', url: '/guides/platform/backups', items: [] },
      ],
    },
    {
      name: 'Platform Management',
      url: undefined,
      items: [
        { name: 'Access Control', url: '/guides/platform/access-control', items: [] },
        { name: 'Database Usage', url: '/guides/platform/database-usage', items: [] },
        { name: 'HTTP Status Codes', url: '/guides/platform/http-status-codes', items: [] },
        { name: 'Logging', url: '/guides/platform/logs', items: [] },
        { name: 'Metrics', url: '/guides/platform/metrics', items: [] },
        {
          name: 'Migrating and Upgrading',
          url: '/guides/platform/migrating-and-upgrading-projects',
          items: [],
        },
        { name: 'Network Restrictions', url: '/guides/platform/network-restrictions', items: [] },
        { name: 'Performance Tuning', url: '/guides/platform/performance', items: [] },
        { name: 'Permissions', url: '/guides/platform/permissions', items: [] },
      ],
    },
    {
      name: 'Single sign-on',
      url: undefined,
      items: [
        {
          name: 'Enable SSO for your organization',
          url: '/guides/platform/sso',
          items: [],
        },
        { name: 'SSO with Azure AD', url: '/guides/platform/sso/azure', items: [] },
        {
          name: 'SSO with Google Workspace',
          url: '/guides/platform/sso/gsuite',
          items: [],
        },
        { name: 'SSO with Okta', url: '/guides/platform/sso/okta', items: [] },
      ],
    },
    {
      name: 'Go-live Checklist',
      url: undefined,
      items: [{ name: 'Production Readiness', url: '/guides/platform/going-into-prod', items: [] }],
    },
    {
      name: 'Troubleshooting',
      url: undefined,
      items: [
        {
          name: 'HTTP and Project Issues',
          url: '/guides/platform/troubleshooting',
          items: [],
        },
      ],
    },
  ],
}

export const resources = {
  icon: 'resources',
  label: 'Resources',
  url: '/guides/resources',
  items: [
    // removing until the examples page is reworked
    // { name: 'Examples', url: '/guides/resources/examples', items: [] },
    { name: 'Glossary', url: '/guides/resources/glossary', items: [] },
    {
      name: 'Migrate to Supabase',
      url: '/guides/resources/migrating-to-supabase',
      items: [
        {
          name: 'Firebase Auth',
          url: '/guides/resources/migrating-to-supabase/firebase-auth',
          items: [],
        },
        {
          name: 'Firestore Data',
          url: '/guides/resources/migrating-to-supabase/firestore-data',
          items: [],
        },
        {
          name: 'Firebase Storage',
          url: '/guides/resources/migrating-to-supabase/firebase-storage',
          items: [],
        },
        {
          name: 'Heroku',
          url: '/guides/resources/migrating-to-supabase/heroku',
          items: [],
        },
      ],
    },
  ],
}

export const self_hosting = {
  title: 'Self-Hosting',
  icon: 'resources',
  url: '/guides/self-hosting',
  items: [
    { name: 'Overview', url: '/guides/self-hosting', items: [] },
    { name: 'Self-Hosting with Docker', url: '/guides/self-hosting/docker', items: [] },
    {
      name: 'Auth Server',
      items: [
        { name: 'Reference', url: '/reference/self-hosting-auth/introduction', items: [] },
        { name: 'Configuration', url: '/guides/self-hosting/auth/config', items: [] },
      ],
    },
    {
      name: 'Storage Server',
      items: [
        { name: 'Reference', url: '/reference/self-hosting-storage/introduction', items: [] },
        { name: 'Configuration', url: '/guides/self-hosting/storage/config', items: [] },
      ],
    },
    {
      name: 'Realtime Server',
      items: [
        { name: 'Reference', url: '/reference/self-hosting-realtime/introduction', items: [] },
        { name: 'Configuration', url: '/guides/self-hosting/realtime/config', items: [] },
      ],
    },
  ],
}

export const migrate = {
  label: 'Migrate to Supabase',
  url: '/guides/migrate',
  items: [
    { name: 'Firebase Auth', url: '/guides/migrations/firebase-auth', items: [] },
    { name: 'Firestore Data', url: '/guides/migrations/firestore-data', items: [] },
    { name: 'Firebase Storage', url: '/guides/migrations/firebase-storage', items: [] },
    { name: 'Heroku', url: '/guides/migrations/heroku', items: [] },
  ],
}

export const integrations = {
  icon: 'integrations',
  label: 'Integrations',
  url: '/guides/integrations',
  items: [
    { name: 'Overview', url: '/guides/integrations/integrations', items: [] },
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
        { name: 'Estuary', url: '/guides/integrations/estuary', items: [] },
        { name: 'pgMustard', url: '/guides/integrations/pgmustard', items: [] },
        { name: 'Prisma', url: '/guides/integrations/prisma', items: [] },
        { name: 'Sequin', url: '/guides/integrations/sequin', items: [] },
        { name: 'Snaplet', url: '/guides/integrations/snaplet', items: [] },
        { name: 'Vercel', url: '/guides/integrations/vercel', items: [] },
        { name: 'WeWeb', url: '/guides/integrations/weweb', items: [] },
        { name: 'Zuplo', url: '/guides/integrations/zuplo', items: [] },
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
        { name: 'FlutterFlow', url: '/guides/integrations/flutterflow', items: [] },
        { name: 'Plasmic', url: '/guides/integrations/plasmic', items: [] },
        { name: 'ILLA', url: '/guides/integrations/illa', items: [] },
      ],
    },
    {
      name: 'Messaging',
      url: undefined,
      items: [{ name: 'OneSignal', url: '/guides/integrations/onesignal', items: [] }],
    },
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
          items: [],
          icon: '/img/icons/menu/reference-javascript',
        },
        {
          name: 'supabase-dart',
          url: '/reference/dart/start',
          level: 'reference_dart',
          items: [],
          icon: '/img/icons/menu/reference-dart',
        },
        {
          name: 'supabase-csharp',
          url: '/reference/csharp/start',
          level: 'reference_csharp',
          items: [],
          icon: '/img/icons/menu/reference-csharp',
        },
        {
          name: 'supbase-python',
          url: '/reference/python/start',
          level: 'reference_python',
          items: [],
          icon: 'docs/img/icons/javascript.svg',
        },
        // {
        //   name: 'supabase-python',
        //   url: '/reference/python/start',
        //   level: 'reference_python',
        //   items: [],
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
          items: [],
          icon: '/img/icons/menu/reference-cli',
        },
        {
          name: 'Management API',
          url: '/reference/javascript',
          items: [],
          icon: '/img/icons/menu/reference-api',
        },
      ],
    },
  ],
}

export const reference_javascript_v1 = {
  icon: 'reference-javascript',
  title: 'javascript',
  url: '/guides/reference/javascript',
  parent: '/reference',
}

export const reference_javascript_v2 = {
  icon: 'reference-javascript',
  title: 'javascript',
  url: '/guides/reference/javascript',
  parent: '/reference',
}

export const reference_dart_v0 = {
  icon: 'reference-dart',
  title: 'Flutter',
  url: '/guides/reference/dart',
  parent: '/reference',
}

export const reference_dart_v1 = {
  icon: 'reference-dart',
  title: 'Flutter',
  url: '/guides/reference/dart',
  parent: '/reference',
}

export const reference_csharp_v0 = {
  icon: 'reference-csharp',
  title: 'c#',
  url: 'guides/reference/csharp',
  parent: '/reference',
}

export const reference_python_v2 = {
  icon: 'reference-python',
  title: 'Python',
  url: '/guides/reference/python',
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
  icon: 'reference-auth',
  title: 'Self-Hosting Auth',
  url: '/guides/reference/self-hosting/auth',
  parent: '/reference',
}

export const reference_self_hosting_storage = {
  icon: 'reference-storage',
  title: 'Self-Hosting Storage',
  url: '/guides/reference/self-hosting/storage',
  parent: '/reference',
}

export const reference_self_hosting_realtime = {
  icon: 'reference-auth',
  title: 'Self-Hosting Realtime',
  url: '/guides/reference/self-hosting/realtime',
  parent: '/reference',
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
      {
        label: 'supabase-csharp',
        versions: ['v0'],
        description: 'something about the reference',
        icon: '/docs/img/icons/c-sharp-icon.svg',
        url: '/reference/csharp/start',
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
