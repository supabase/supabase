import type { ContentListingGroup } from '~/lib/content-listings.schema'

export const supabaseWayDatabaseBuild: ContentListingGroup = {
  id: 'supabase-way-database-build',
  heading: 'Build it',
  headingLevel: 'h3',
  type: 'grid',
  columns: 3,
  items: [
    {
      title: 'Database overview',
      href: '/guides/database/overview',
      description: 'Tables, relationships, and the Postgres features Supabase gives you.',
    },
    {
      title: 'REST API',
      href: '/guides/api',
      description: 'The REST API auto-generated from your schema.',
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
      title: 'Auth overview',
      href: '/guides/auth',
      description: 'Users, sessions, and the providers Supabase Auth supports.',
    },
    {
      title: 'Server-side auth',
      href: '/guides/auth/server-side',
      description: 'Handle sessions and cookies in server-rendered apps.',
    },
    {
      title: 'Social login',
      href: '/guides/auth/social-login',
      description: 'Add sign-in with Google, GitHub, and other providers.',
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
      title: 'Realtime overview',
      href: '/guides/realtime',
      description: 'Stream changes, broadcast messages, and track presence.',
    },
    {
      title: 'Postgres Changes',
      href: '/guides/realtime/postgres-changes',
      description: 'Subscribe to inserts, updates, and deletes on your tables.',
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
  columns: 3,
  items: [
    {
      title: 'Storage overview',
      href: '/guides/storage',
      description: 'S3-compatible object storage with metadata in Postgres.',
    },
    {
      title: 'Access control',
      href: '/guides/storage/security/access-control',
      description: 'Secure buckets and objects with RLS policies.',
    },
    {
      title: 'Image transformations',
      href: '/guides/storage/serving/image-transformations',
      description: 'Resize and optimize images as you serve them.',
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
      title: 'Security',
      href: '/guides/security/product-security',
      description: 'Harden your project against common risks.',
    },
    {
      title: 'Performance and advisors',
      href: '/guides/observability/advisors',
      description: 'Deterministic checks for security and performance issues.',
    },
  ],
}
