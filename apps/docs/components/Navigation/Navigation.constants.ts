// [Terry] Also need to look at getPageType() in ./lib/helpers
// to set a menu to a page
import SupabaseJsV1Nav from 'data/nav/supabase-js/v1'
import SupabaseJsV2Nav from 'data/nav/supabase-js/v2'
import SupabaseDartV0Nav from 'data/nav/supabase-dart/v0'
import SupabaseDartV1Nav from 'data/nav/supabase-dart/v1'
import SupabaseCLINav from 'data/nav/supabase-cli'
import SupabaseAPINav from 'data/nav/supabase-api'
import AuthServerNav from 'data/nav/auth-server'
import RealtimeServerNav from 'data/nav/realtime-server'
import StorageServerNav from 'data/nav/storage-server'

import { NavMenu, References } from './Navigation.types'

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

export const menuItems: NavMenu = {
  docs: [
    {
      label: 'Overview',
      items: [
        { name: 'Introduction', url: '/', items: [] },
        { name: 'Features', url: '/features', items: [] },
        { name: 'Architecture', url: '/architecture', items: [] },
      ],
    },
    {
      label: 'Quickstarts',
      items: [
        { name: 'Angular', url: '/guides/with-angular', items: [] },
        { name: 'Expo', url: '/guides/with-expo', items: [] },
        { name: 'Flutter', url: '/guides/with-flutter', items: [] },
        { name: 'Ionic Angular', url: '/guides/with-ionic-angular', items: [] },
        { name: 'Ionic React', url: '/guides/with-ionic-react', items: [] },
        { name: 'Ionic Vue', url: '/guides/with-ionic-vue', items: [] },
        { name: 'Next.js', url: '/guides/with-nextjs', items: [] },
        { name: 'Nuxt 3', url: '/guides/with-nuxt-3', items: [] },
        { name: 'React', url: '/guides/with-react', items: [] },
        { name: 'RedwoodJS', url: '/guides/with-redwoodjs', items: [] },
        { name: 'SolidJS', url: '/guides/with-solidjs', items: [] },
        { name: 'Svelte', url: '/guides/with-svelte', items: [] },
        { name: 'SvelteKit', url: '/guides/with-sveltekit', items: [] },
        { name: 'Vue 3', url: '/guides/with-vue-3', items: [] },
      ],
    },
    {
      label: 'CLI',
      items: [
        { name: 'Overview', url: '/guides/cli', items: [] },
        { name: 'Local Development', url: '/guides/cli/local-development', items: [] },
        { name: 'Managing Environments', url: '/guides/cli/managing-environments', items: [] },
      ],
    },
    {
      label: 'Auth',
      items: [
        { name: 'Overview', url: '/guides/auth', items: [] },
        {
          name: 'Authentication',
          url: undefined,
          items: [
            { name: 'Login with Email', url: '/guides/auth/auth-email', items: [] },
            { name: 'Login with Magic Link', url: '/guides/auth/auth-magic-link', items: [] },
            { name: 'Login with Apple', url: '/guides/auth/auth-apple', items: [] },
            { name: 'Login with Azure', url: '/guides/auth/auth-azure', items: [] },
            { name: 'Login with Bitbucket', url: '/guides/auth/auth-bitbucket', items: [] },
            { name: 'Login with Discord', url: '/guides/auth/auth-discord', items: [] },
            { name: 'Login with Facebook', url: '/guides/auth/auth-facebook', items: [] },
            { name: 'Login with Github', url: '/guides/auth/auth-github', items: [] },
            { name: 'Login with Gitlab', url: '/guides/auth/auth-gitlab', items: [] },
            { name: 'Login with Google', url: '/guides/auth/auth-google', items: [] },
            { name: 'Login with Keycloak', url: '/guides/auth/auth-keycloak', items: [] },
            { name: 'Login with LinkedIn', url: '/guides/auth/auth-linkedin', items: [] },
            { name: 'Login with Notion', url: '/guides/auth/auth-notion', items: [] },
            { name: 'Login with Slack', url: '/guides/auth/auth-slack', items: [] },
            { name: 'Login with Spotify', url: '/guides/auth/auth-spotify', items: [] },
            { name: 'Login with Twitch', url: '/guides/auth/auth-twitch', items: [] },
            { name: 'Login with Twitter', url: '/guides/auth/auth-twitter', items: [] },
            { name: 'Login with WorkOS', url: '/guides/auth/auth-workos', items: [] },
            { name: 'Phone Auth with Twilio', url: '/guides/auth/auth-twilio', items: [] },
            { name: 'Phone Auth with Vonage', url: '/guides/auth/auth-vonage', items: [] },
            {
              name: 'Phone Auth with MessageBird',
              url: '/guides/auth/auth-messagebird',
              items: [],
            },
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
    },
    {
      label: 'Database',
      items: [
        { name: 'Overview', url: '/guides/database', items: [] },
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
              name: 'plv8: Javascript Language',
              url: '/guides/database/extensions/plv8',
              items: [],
            },
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
    },
    {
      label: 'Edge Functions',
      items: [
        { name: 'Overview', url: '/guides/functions', items: [] },
        { name: 'Auth', url: '/guides/functions/auth', items: [] },
        { name: 'Examples', url: '/guides/functions/examples', items: [] },
        { name: 'CI/CD Workflow', url: '/guides/functions/cicd-workflow', items: [] },
      ],
    },
    {
      label: 'Realtime',
      items: [
        { name: 'Overview', url: '/guides/realtime', items: [] },
        { name: 'Quickstart', url: '/guides/realtime/quickstart', items: [] },
        { name: 'Postgres CDC', url: '/guides/realtime/postgres-cdc', items: [] },
        { name: 'Rate Limits', url: '/guides/realtime/rate-limits', items: [] },
      ],
    },
    {
      label: 'Storage',
      items: [
        { name: 'Overview', url: '/guides/storage', items: [] },
        { name: 'CDN', url: '/guides/storage-cdn', items: [] },
      ],
    },
    {
      label: 'Platform',
      items: [
        { name: 'Overview', url: '/guides/hosting/platform', items: [] },
        { name: 'Compute Add-ons', url: '/guides/platform/compute-add-ons', items: [] },
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
    },
    {
      label: 'Self Hosting',
      items: [
        { name: 'Overview', url: '/guides/hosting/overview', items: [] },
        { name: 'Docker', url: '/guides/hosting/docker', items: [] },
      ],
    },
    {
      label: 'Migrate to Supabase',
      items: [
        { name: 'Firebase Auth', url: '/guides/migrations/firebase-auth', items: [] },
        { name: 'Firestore Data', url: '/guides/migrations/firestore-data', items: [] },
        { name: 'Firebase Storage', url: '/guides/migrations/firebase-storage', items: [] },
        { name: 'Heroku', url: '/guides/migrations/heroku', items: [] },
      ],
    },
    {
      label: 'Integrations',
      items: [
        { name: 'Supabase Marketplace', url: '/guides/integrations/integrations', items: [] },
        {
          name: 'Auth',
          url: undefined,
          items: [
            { name: 'Auth0', url: '/guides/integrations/auth0', items: [] },
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
            { name: 'WeWeb', url: '/guides/integrations/weweb', items: [] },
          ],
        },
      ],
    },
  ],
  reference: [
    {
      label: 'Official',
      items: [
        { name: 'Reference Documentation', url: '/reference', items: [] },
        { name: 'Supabase JavaScript Library', url: '/reference/javascript', items: [] },
        { name: 'Supabase Flutter Library', url: '/reference/dart', items: [] },
        { name: 'Supabase CLI', url: '/reference/cli', items: [] },
        { name: 'Management API', url: '/reference/api', items: [] },
      ],
    },
    {
      label: 'Self-hosting',
      items: [
        { name: 'Auth Server', url: '/reference/auth', items: [] },
        { name: 'Realtime Server', url: '/reference/realtime', items: [] },
        { name: 'Storage Server', url: '/reference/storage', items: [] },
      ],
    },
  ],
  'reference/javascript': SupabaseJsV2Nav,
  'reference/javascript/v1': SupabaseJsV1Nav,
  'reference/dart': SupabaseDartV1Nav,
  'reference/dart/v0': SupabaseDartV0Nav,
  'reference/cli': SupabaseCLINav,
  'reference/api': SupabaseAPINav,
  'reference/auth': AuthServerNav,
  'reference/realtime': RealtimeServerNav,
  'reference/storage': StorageServerNav,
}
