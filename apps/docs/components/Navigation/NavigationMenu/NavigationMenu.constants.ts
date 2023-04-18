import { References } from '../Navigation.types'

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
  swift: {
    name: 'Swift',
    library: 'supabase-swift',
    versions: ['v1'],
    icon: '/docs/img/libraries/swift-icon.svg',
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
    { name: 'Features', url: '/guides/getting-started/features' },
    { name: 'Architecture', url: '/guides/getting-started/architecture' },
    // { name: 'Local Development', url: '/guides/cli/local-development' }, // Disabling this until we actually move the doc into this section
    {
      name: 'Framework Quickstarts',
      items: [
        { name: 'React', url: '/guides/getting-started/quickstarts/reactjs' },
        { name: 'NextJS', url: '/guides/getting-started/quickstarts/nextjs' },
        { name: 'RedwoodJS', url: '/guides/getting-started/quickstarts/redwoodjs' },
        { name: 'Flutter', url: '/guides/getting-started/quickstarts/flutter' },
        { name: 'SvelteKit', url: '/guides/getting-started/quickstarts/sveltekit' },
        { name: 'SolidJS', url: '/guides/getting-started/quickstarts/solidjs' },
        { name: 'Vue', url: '/guides/getting-started/quickstarts/vue' },
      ],
    },
    {
      name: 'Web app tutorials',
      items: [
        {
          name: 'NextJS',
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
          name: 'Expo',
          url: '/guides/getting-started/tutorials/with-expo',
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
      ],
    },
    {
      name: 'AI & ML',
      items: [
        {
          name: 'Vector Search with OpenAI',
          url: '/guides/getting-started/openai/vector-search',
        },
      ],
    },
  ],
}

export const cli = {
  title: 'CLI',
  items: [
    { name: 'Overview', url: '/guides/cli' },
    { name: 'Local Development', url: '/guides/cli/local-development' },
    { name: 'Managing Environments', url: '/guides/cli/managing-environments' },
  ],
}

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
    name: 'Azure',
    icon: '/docs/img/icons/microsoft-icon',
    url: '/guides/auth/social-login/auth-azure',
  },
  {
    name: 'Twitter',
    icon: '/docs/img/icons/twitter-icon',
    url: '/guides/auth/social-login/auth-twitter',
  },
  {
    name: 'GitHub',
    icon: '/docs/img/icons/github-icon',
    url: '/guides/auth/social-login/auth-github',
    isDarkMode: true,
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
    name: 'MessageBird SMS Login',
    icon: '/docs/img/icons/messagebird-icon',
    linkDescription: 'Communication between businesses and their customers — across any channel.',
    url: '/guides/auth/phone-login/messagebird',
  },
  {
    name: 'Twilio SMS Login',
    icon: '/docs/img/icons/twilio-icon',
    url: '/guides/auth/phone-login/twilio',
    linkDescription: 'Customer engagement platform used by hundreds of thousands of businesses.',
  },
  {
    name: 'Vonage SMS Login',
    icon: '/docs/img/icons/vonage-icon',
    url: '/guides/auth/phone-login/vonage',
    linkDescription:
      'Vonage is a communication platform as a service (CPaaS) provider for consumers and businesses.',
    isDarkMode: true,
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
      name: 'Quickstarts',
      items: [{ name: 'Auth with React', url: '/guides/auth/quickstarts/react', items: [] }],
    },
    {
      name: 'Authentication',
      url: undefined,
      items: [
        { name: 'Email Login', url: '/guides/auth/auth-email' },
        { name: 'Magic Link Login', url: '/guides/auth/auth-magic-link' },
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
        {
          name: 'Enterprise SSO',
          url: '/guides/auth/enterprise-sso',
          items: [
            {
              name: 'SAML 2.0',
              url: '/guides/auth/sso/auth-sso-saml',
            },
          ],
        },
        { name: 'Email Templates', url: '/guides/auth/auth-email-templates' },
      ],
    },
    {
      name: 'Authorization',
      url: undefined,
      items: [
        { name: 'Enable Captcha Protection', url: '/guides/auth/auth-captcha' },
        { name: 'Managing User Data', url: '/guides/auth/managing-user-data' },
        { name: 'Multi-Factor Authentication', url: '/guides/auth/auth-mfa' },
        { name: 'Row Level Security', url: '/guides/auth/row-level-security' },
        { name: 'Server-side Rendering', url: '/guides/auth/server-side-rendering' },
      ],
    },
    {
      name: 'Auth Helpers',
      url: undefined,
      items: [
        { name: 'Overview', url: '/guides/auth/auth-helpers' },
        { name: 'Auth UI', url: '/guides/auth/auth-helpers/auth-ui' },
        { name: 'Next.js (pages)', url: '/guides/auth/auth-helpers/nextjs' },
        {
          name: 'Next.js (app)',
          url: '/guides/auth/auth-helpers/nextjs-server-components',
        },
        { name: 'Remix', url: '/guides/auth/auth-helpers/remix' },
        { name: 'SvelteKit', url: '/guides/auth/auth-helpers/sveltekit' },
      ],
    },
    {
      name: 'Deep Dive',
      url: undefined,
      items: [
        {
          name: 'Part One: JWTs',
          url: '/learn/auth-deep-dive/auth-deep-dive-jwts',
        },
        {
          name: 'Part Two: Row Level Security',
          url: '/learn/auth-deep-dive/auth-row-level-security',
        },
        { name: 'Part Three: Policies', url: '/learn/auth-deep-dive/auth-policies' },
        { name: 'Part Four: GoTrue', url: '/learn/auth-deep-dive/auth-gotrue' },
        {
          name: 'Part Five: Google OAuth',
          url: '/learn/auth-deep-dive/auth-google-oauth',
        },
      ],
    },
  ],
}

export const database = {
  icon: 'database',
  title: 'Database',
  url: '/guides/database',
  items: [
    { name: 'Database Connections', url: '/guides/database/connecting-to-postgres' },
    { name: 'Tables and Data', url: '/guides/database/tables' },
    { name: 'Database Functions', url: '/guides/database/functions' },
    { name: 'Database Webhooks', url: '/guides/database/webhooks' },
    { name: 'Full Text Search', url: '/guides/database/full-text-search' },
    { name: 'Database Testing', url: '/guides/database/testing' },
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
        { name: 'http: RESTful Client', url: '/guides/database/extensions/http' },
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
          url: '/guides/database/extensions/pgcron',
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
          url: '/guides/database/extensions/pgnet',
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
          name: 'pg_repack: Storage Optimization',
          url: '/guides/database/extensions/pgrepack',
        },
        {
          name: 'PostGIS: Geo queries',
          url: '/guides/database/extensions/postgis',
        },
        {
          name: 'pg-safeupdate: Required Where Clauses',
          url: '/guides/database/extensions/pg-safeupdate',
        },
        {
          name: 'pgsodium: Encryption Features',
          url: '/guides/database/extensions/pgsodium',
        },
        { name: 'pgTAP: Unit Testing', url: '/guides/database/extensions/pgtap' },
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
        {
          name: 'wrappers: 3rd Party Integrations',
          url: '/guides/database/extensions/wrappers',
        },
      ],
    },
    {
      name: 'Postgres resources',
      url: undefined,
      items: [
        {
          name: 'Managing Indexes',
          url: '/guides/database/postgres/indexes',
        },
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
      ],
    },
    {
      name: 'Configuration',
      url: undefined,
      items: [
        { name: 'Timeouts', url: '/guides/database/timeouts' },
        { name: 'Replication', url: '/guides/database/replication' },
        { name: 'Passwords', url: '/guides/database/managing-passwords' },
        { name: 'Timezones', url: '/guides/database/managing-timezones' },
      ],
    },
  ],
}

export const api = {
  icon: 'reference',
  title: 'Serverless APIs',
  url: '/guides/api',
  items: [
    { name: 'Overview', url: '/guides/api', items: [] },
    { name: 'Quickstart', url: '/guides/api/quickstart', items: [] },
    {
      name: 'Guides',
      url: '/guides/api',
      items: [
        { name: 'Creating API routes', url: '/guides/api/creating-routes', items: [] },
        { name: 'How API Keys work', url: '/guides/api/api-keys', items: [] },
        { name: 'Securing your API', url: '/guides/api/securing-your-api', items: [] },
        {
          name: 'Querying joins and nested tables',
          url: '/guides/api/joins-and-nesting',
          items: [],
        },
      ],
    },
    {
      name: 'REST & REALTIME',
      url: undefined,
      items: [
        { name: 'Auto-generated Docs', url: '/guides/api/rest/auto-generated-docs', items: [] },
        { name: 'Client Libraries', url: '/guides/api/rest/client-libs', items: [] },
        { name: 'Generating Types', url: '/guides/api/rest/generating-types', items: [] },
      ],
    },
    {
      name: 'GRAPHQL',
      url: undefined,
      items: [{ name: 'GraphiQL Documentation', url: '/guides/api/graphql/graphiql', items: [] }],
    },
  ],
}

export const functions = {
  icon: 'functions',
  title: 'Edge Functions',
  url: '/guides/functions',
  items: [
    {
      name: 'Overview',
      url: '/guides/functions',
    },
    {
      name: 'Quickstart',
      url: '/guides/functions/quickstart',
    },
    {
      name: 'Features',
      url: undefined,
      items: [
        { name: 'TypeScript Support', url: '/guides/functions/typescript-support' },
        { name: 'Debugging Edge Functions', url: '/guides/functions/debugging' },
        { name: 'Managing packages using Import Maps', url: '/guides/functions/import-maps' },
        { name: 'Globally Distributed Deployments', url: '/guides/functions/global-deployments' },
      ],
    },
    {
      name: 'Guides',
      url: undefined,
      items: [
        { name: 'Developing Functions locally', url: '/guides/functions/local-development' },
        { name: 'Deploying with Git', url: '/guides/functions/cicd-workflow' },
        { name: 'Managing Secrets and Environment Variables', url: '/guides/functions/secrets' },
        { name: 'Integrating With Supabase Auth', url: '/guides/functions/auth' },
        {
          name: 'Integrating with Supabase Storage',
          url: '/guides/functions/storage-caching',
        },
        { name: 'CORS support for Invoking from the browser', url: '/guides/functions/cors' },
        { name: 'Scheduling Functions', url: '/guides/functions/schedule-functions' },
        {
          name: 'Connecting directly to Postgres',
          url: '/guides/functions/connect-to-postgres',
        },
        { name: 'Dart Edge on Supabase', url: '/guides/functions/dart-edge' },
      ],
    },
    {
      name: 'Examples',
      url: '/guides/functions/examples',
      items: [
        { name: 'Generating OpenAI GPT3 completions', url: '/guides/functions/examples/openai' },
        { name: 'Generating OG images ', url: '/guides/functions/examples/og-image' },
        {
          name: 'CAPTCHA support with Cloudflare Turnstile',
          url: '/guides/functions/examples/cloudflare-turnstile',
        },
        { name: 'Building a Discord Bot', url: '/guides/functions/examples/discord-bot' },
        { name: 'Building a Telegram Bot', url: '/guides/functions/examples/telegram-bot' },
        { name: 'Handling Stripe Webhooks ', url: '/guides/functions/examples/stripe-webhooks' },
        { name: 'Integrating with Upstash Redis', url: '/guides/functions/examples/upstash-redis' },
        { name: 'Rate Limiting Edge Functions', url: '/guides/functions/examples/rate-limiting' },
        {
          name: 'Taking Screenshots with Puppeteer',
          url: '/guides/functions/examples/screenshots',
        },
      ],
    },
  ],
}

export const realtime = {
  icon: 'realtime',
  title: 'Realtime',
  url: '/guides/realtime',
  items: [
    {
      name: 'Overview',
      url: '/guides/realtime',
    },
    {
      name: 'Quickstart',
      url: '/guides/realtime/quickstart',
    },
    {
      name: 'Features',
      url: undefined,
      items: [
        { name: 'Channels', url: '/guides/realtime/channels' },
        {
          name: 'Extensions',
          url: '/guides/realtime/extensions',
          items: [
            { name: 'Broadcast', url: '/guides/realtime/extensions/broadcast' },
            { name: 'Presence', url: '/guides/realtime/extensions/presence' },
            {
              name: 'Postgres Changes',
              url: '/guides/realtime/extensions/postgres-changes',
            },
          ],
        },
      ],
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
          name: 'Bring Your Own Database',
          url: '/guides/realtime/bring-your-own-database',
          items: [],
        },
        {
          name: 'Using Realtime with Next.js',
          url: '/guides/realtime/realtime-with-nextjs',
        },
      ],
    },
    {
      name: 'Deep dive',
      url: undefined,
      items: [
        { name: 'Rate Limits', url: '/guides/realtime/rate-limits' },
        { name: 'Architecture', url: '/guides/realtime/architecture' },
        { name: 'Protocol', url: '/guides/realtime/protocol' },
      ],
    },
  ],
}

export const storage = {
  icon: 'storage',
  title: 'Storage',
  url: '/guides/storage',
  items: [
    { name: 'Overview', url: '/guides/storage' },
    { name: 'Quickstart', url: '/guides/storage/quickstart' },
    { name: 'Uploads', url: '/guides/storage/uploads' },
    { name: 'Access Control', url: '/guides/storage/access-control' },
    { name: 'CDN', url: '/guides/storage/cdn' },
    { name: 'Image Transformations', url: '/guides/storage/image-transformations' },
  ],
}

export const supabase_cli = {
  icon: 'reference-cli',
  title: 'Supabase CLI',
  url: '/guides/cli',
  items: [
    { name: 'Overview', url: '/guides/cli' },
    { name: 'Local Development', url: '/guides/cli/local-development' },
    { name: 'Managing Environments', url: '/guides/cli/managing-environments' },
    {
      name: 'Reference',
      url: undefined,
      items: [
        { name: 'Commands', url: '/reference/cli/introduction' },
        { name: 'Configuration', url: '/reference/cli/config' },
      ],
    },
  ],
}

export const platform = {
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
      ],
    },
    {
      name: 'Platform Management',
      url: undefined,
      items: [
        { name: 'Access Control', url: '/guides/platform/access-control' },
        { name: 'Database Size', url: '/guides/platform/database-size' },
        { name: 'HTTP Status Codes', url: '/guides/platform/http-status-codes' },
        { name: 'Logging', url: '/guides/platform/logs' },
        { name: 'Metrics', url: '/guides/platform/metrics' },
        {
          name: 'Migrating and Upgrading',
          url: '/guides/platform/migrating-and-upgrading-projects',
        },
        { name: 'Network Restrictions', url: '/guides/platform/network-restrictions' },
        { name: 'Performance Tuning', url: '/guides/platform/performance' },
        { name: 'Permissions', url: '/guides/platform/permissions' },
        { name: 'SSL Enforcement', url: '/guides/platform/ssl-enforcement' },
      ],
    },
    {
      name: 'Billing',
      url: undefined,
      items: [{ name: 'Spend cap', url: '/guides/platform/spend-cap' }],
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
      name: 'Go-live Checklist',
      url: undefined,
      items: [{ name: 'Production Readiness', url: '/guides/platform/going-into-prod' }],
    },
    {
      name: 'Troubleshooting',
      url: undefined,
      items: [
        {
          name: 'HTTP and Project Issues',
          url: '/guides/platform/troubleshooting',
        },
      ],
    },
  ],
}

export const resources = {
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
      ],
    },
  ],
}

export const self_hosting = {
  title: 'Self-Hosting',
  icon: 'resources',
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
        { name: 'Reference', url: '/reference/self-hosting-storage/introduction' },
        { name: 'Configuration', url: '/guides/self-hosting/storage/config' },
      ],
    },
    {
      name: 'Realtime Server',
      items: [
        { name: 'Reference', url: '/reference/self-hosting-realtime/introduction' },
        { name: 'Configuration', url: '/guides/self-hosting/realtime/config' },
      ],
    },
    {
      name: 'Analytics Server',
      items: [
        { name: 'Reference', url: '/reference/self-hosting-analytics/introduction', items: [] },
        { name: 'Configuration', url: '/guides/self-hosting/analytics/config', items: [] },
      ],
    },
    {
      name: 'Functions Server',
      items: [
        { name: 'Reference', url: '/reference/self-hosting-functions/introduction', items: [] },
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

export const integrations = {
  icon: 'integrations',
  title: 'Integrations',
  url: '/guides/integrations',
  items: [
    { name: 'Overview', url: '/guides/integrations/integrations' },
    {
      name: 'Auth',
      url: undefined,
      items: [
        {
          name: 'Auth0',
          url: '/guides/integrations/auth0',
        },
        { name: 'Authsignal', url: '/guides/integrations/authsignal' },
        { name: 'Clerk', url: '/guides/integrations/clerk' },
        { name: 'keyri', url: '/guides/integrations/keyri' },
        { name: 'Stytch', url: '/guides/integrations/stytch' },
        { name: 'SuperTokens', url: '/guides/integrations/supertokens' },
      ],
    },
    {
      name: 'Caching / Offline-first',
      url: undefined,
      items: [{ name: 'Polyscale', url: '/guides/integrations/polyscale' }],
    },
    {
      name: 'Developer Tools',
      url: undefined,
      items: [
        { name: 'Estuary', url: '/guides/integrations/estuary' },
        { name: 'OpenAI', url: '/guides/functions/examples/openai' },
        { name: 'pgMustard', url: '/guides/integrations/pgmustard' },
        { name: 'Prisma', url: '/guides/integrations/prisma' },
        { name: 'Sequin', url: '/guides/integrations/sequin' },
        { name: 'Snaplet', url: '/guides/integrations/snaplet' },
        { name: 'Vercel', url: '/guides/integrations/vercel' },
        { name: 'Upstash Redis', url: '/guides/functions/examples/upstash-redis' },
        { name: 'WeWeb', url: '/guides/integrations/weweb' },
        { name: 'Zuplo', url: '/guides/integrations/zuplo' },
      ],
    },
    {
      name: 'Low-code',
      url: undefined,
      items: [
        { name: 'Appsmith', url: '/guides/integrations/appsmith' },
        { name: 'DhiWise', url: '/guides/integrations/dhiwise' },
        { name: 'Directus', url: '/guides/integrations/directus' },
        { name: 'Draftbit', url: '/guides/integrations/draftbit' },
        { name: 'FlutterFlow', url: '/guides/integrations/flutterflow' },
        { name: 'Plasmic', url: '/guides/integrations/plasmic' },
        { name: 'ILLA', url: '/guides/integrations/illa' },
      ],
    },
    {
      name: 'Messaging',
      url: undefined,
      items: [{ name: 'OneSignal', url: '/guides/integrations/onesignal' }],
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
  icon: 'reference-realtime',
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

// export const reference: [
//   {
//     label: 'Official'
//     items: [
//       { name: 'Reference Documentation'; url: '/reference'; },
//       { name: 'Supabase JavaScript Library'; url: '/reference/javascript'; },
//       { name: 'Supabase Flutter Library'; url: '/reference/dart'; },
//       { name: 'Supabase CLI'; url: '/reference/cli'; },
//       { name: 'Management API'; url: '/reference/api'; }
//     ]
//   },
//   {
//     label: 'Self-hosting'
//     items: [
//       { name: 'Auth Server'; url: '/reference/auth'; },
//       { name: 'Storage Server'; url: '/reference/storage'; }
//     ]
//   }
//     {
//       label: 'Clients',
//       items: [
//         { name: 'Auth Server', url: '/reference/auth'},
//         { name: 'Storage Server', url: '/reference/storage'},
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
      {
        label: 'supabase-swift',
        versions: ['v1'],
        description: 'something about the reference',
        icon: '/docs/img/icons/swift-icon.svg',
        url: '/reference/swift/start',
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
