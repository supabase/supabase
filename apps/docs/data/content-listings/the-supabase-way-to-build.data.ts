import type { ContentListingGroup } from '~/lib/content-listings.schema'

export const supabaseWayProgression: ContentListingGroup = {
  id: 'supabase-way-progression',
  type: 'progression',
  items: [
    {
      title: 'Start with a database',
      subtitle: 'Postgres + API',
      href: '#start-with-a-database-postgres--api',
      icon: 'database',
    },
    {
      title: 'Add users',
      subtitle: 'Auth',
      href: '#add-users-auth',
      icon: 'auth',
    },
    {
      title: 'Scope data to each user',
      subtitle: 'Row-Level Security',
      href: '#scope-data-to-each-user-row-level-security',
      icon: 'rls',
    },
    {
      title: 'Handle files and uploads',
      subtitle: 'Storage',
      href: '#handle-files-and-uploads-storage',
      icon: 'storage',
    },
    {
      title: 'Add server-side logic',
      subtitle: 'Edge Functions',
      href: '#add-server-side-logic-edge-functions',
      icon: 'functions',
    },
    {
      title: 'Reflect changes live',
      subtitle: 'Realtime',
      href: '#reflect-changes-live-realtime',
      icon: 'realtime',
    },
    {
      title: 'Serve real traffic',
      subtitle: 'Harden for production',
      href: '#serve-real-traffic-harden-for-production',
      icon: 'production',
    },
  ],
}

export const supabaseWayDatabaseBuild: ContentListingGroup = {
  id: 'supabase-way-database-build',
  heading: 'Build it',
  headingLevel: 'h3',
  type: 'grid',
  columns: 3,
  items: [
    {
      title: 'Tables and data',
      href: '/guides/database/tables',
      description: 'Create tables and relationships, and edit rows from the Dashboard.',
    },
    {
      title: 'API keys',
      href: '/guides/getting-started/api-keys',
      description: 'Use a publishable key in the browser and a secret key only on the server.',
    },
    {
      title: 'Connect a framework',
      href: '/guides/getting-started/quickstarts/nextjs',
      description: 'Wire your app to Supabase with a framework quickstart.',
    },
  ],
}

export const supabaseWayAuthBuild: ContentListingGroup = {
  id: 'supabase-way-auth-build',
  heading: 'Build it',
  headingLevel: 'h3',
  type: 'grid',
  columns: 3,
  items: [
    {
      title: 'Password-based auth',
      href: '/guides/auth/passwords',
      description: 'Sign up and sign in users with email and password.',
    },
    {
      title: 'Server-side auth',
      href: '/guides/auth/server-side',
      description: 'Handle sessions and cookies in server-rendered apps.',
    },
    {
      title: 'Which package to use',
      href: '/guides/auth/choosing-a-server-package',
      description: 'Choose supabase-js, @supabase/ssr, or @supabase/server for server code.',
    },
  ],
}

export const supabaseWayRlsBuild: ContentListingGroup = {
  id: 'supabase-way-rls-build',
  heading: 'Build it',
  headingLevel: 'h3',
  type: 'grid',
  columns: 2,
  items: [
    {
      title: 'Row Level Security',
      href: '/guides/database/postgres/row-level-security',
      description: 'Write policies that Postgres enforces on every query.',
    },
    {
      title: 'Column Level Security',
      href: '/guides/database/postgres/column-level-security',
      description: 'Restrict access to specific columns within a table.',
    },
  ],
}

export const supabaseWayRealtimeBuild: ContentListingGroup = {
  id: 'supabase-way-realtime-build',
  heading: 'Build it',
  headingLevel: 'h3',
  type: 'grid',
  columns: 3,
  items: [
    {
      title: 'Broadcast from database',
      href: '/guides/realtime/subscribing-to-database-changes#using-broadcast',
      description:
        'Send database changes to subscribed clients with Broadcast, the scalable option.',
    },
    {
      title: 'Postgres Changes',
      href: '/guides/realtime/postgres-changes',
      description: 'Subscribe to table changes directly. Simpler to set up, with scaling limits.',
    },
    {
      title: 'Presence',
      href: '/guides/realtime/presence',
      description: 'Track who is online and share ephemeral state.',
    },
  ],
}

export const supabaseWayStorageBuild: ContentListingGroup = {
  id: 'supabase-way-storage-build',
  heading: 'Build it',
  headingLevel: 'h3',
  type: 'grid',
  columns: 2,
  items: [
    {
      title: 'Storage quickstart',
      href: '/guides/storage/quickstart',
      description: 'Upload files to a bucket and serve them.',
    },
    {
      title: 'Access control',
      href: '/guides/storage/security/access-control',
      description: 'Secure buckets and objects with RLS policies.',
    },
  ],
}

export const supabaseWayFunctionsBuild: ContentListingGroup = {
  id: 'supabase-way-functions-build',
  heading: 'Build it',
  headingLevel: 'h3',
  type: 'grid',
  columns: 3,
  items: [
    {
      title: 'Edge Functions overview',
      href: '/guides/functions',
      description: 'Run TypeScript server-side, close to your users.',
    },
    {
      title: 'Database functions',
      href: '/guides/database/functions',
      description: 'Keep data-shaped logic inside Postgres.',
    },
    {
      title: 'Database webhooks',
      href: '/guides/database/webhooks',
      description: 'Trigger external services when your data changes.',
    },
  ],
}

export const supabaseWayProductionBuild: ContentListingGroup = {
  id: 'supabase-way-production-build',
  heading: 'Build it',
  headingLevel: 'h3',
  type: 'grid',
  columns: 3,
  items: [
    {
      title: 'Production checklist',
      href: '/guides/deployment/going-into-prod',
      description: 'What to review before you launch.',
    },
    {
      title: 'Connection pooling',
      href: '/guides/database/connecting-to-postgres',
      description: 'Choose a direct connection or a Supavisor pooler for your clients.',
    },
    {
      title: 'Backups',
      href: '/guides/platform/backups',
      description: 'Scheduled backups on paid plans, and how to restore them.',
    },
  ],
}
