import type { ContentListingGroup } from '~/lib/content-listings.schema'

export const databaseGetStarted: ContentListingGroup = {
  id: 'database-get-started',
  heading: 'Get started',
  description: "If you're new to the database section, these are the pages to read first:",
  type: 'grid',
  columns: 2,
  items: [
    {
      title: 'Connect to your database',
      href: '/guides/database/connecting-to-postgres',
      description:
        'Connection strings, the Supavisor connection pooler, and when to use direct, transaction, or session mode.',
    },
    {
      title: 'Tables and data',
      href: '/guides/database/tables',
      description: 'Create tables and relationships, and edit rows from the Dashboard.',
    },
    {
      title: 'Import data',
      href: '/guides/database/import-data',
      description: 'Load existing data from CSV files, `pg_dump`, or another Postgres database.',
    },
    {
      title: 'Secure your data',
      href: '/guides/database/secure-data',
      description:
        'Row Level Security (RLS) is how Supabase makes the database safe to query directly from the client. Read this before exposing any table to your app.',
    },
    {
      title: 'Extensions',
      href: '/guides/database/extensions',
      description:
        'Add Postgres extensions from the Dashboard, including `pgvector` for embeddings, `PostGIS` for geospatial data, and `pg_cron` for scheduled jobs.',
    },
    {
      title: 'Run SQL commands',
      href: 'https://supabase.com/dashboard/project/_/sql',
      description: "Use the Dashboard's SQL Editor for ad-hoc queries and saved snippets.",
    },
  ],
}

export const databaseNextSteps: ContentListingGroup = {
  id: 'database-next-steps',
  heading: 'Next steps',
  description:
    "Once you've covered the basics, these guides help with other use cases and features:",
  type: 'grid',
  items: [
    {
      title: 'Database functions',
      href: '/guides/database/functions',
      description: 'Run logic inside the database in response to inserts, updates, or deletes.',
    },
    {
      title: 'Triggers',
      href: '/guides/database/postgres/triggers',
      description: 'Run logic inside the database in response to inserts, updates, or deletes.',
    },
    {
      title: 'Database webhooks',
      href: '/guides/database/webhooks',
      description: 'Send row changes to an external HTTP endpoint.',
    },
    {
      title: 'Replication and read replicas',
      href: '/guides/database/replication',
      description: 'Stream changes to other systems or read from a geographically closer replica.',
    },
    {
      title: 'Backups',
      href: '/guides/platform/backups',
      description:
        'Daily backups on every project, with point-in-time recovery on paid plans. Backups cover the database itself; objects stored through the Storage API are not included.',
    },
    {
      title: 'Query performance and optimization',
      href: '/guides/database/query-optimization',
      description: 'Indexes, the query planner, and tools for finding slow queries.',
    },
    {
      title: 'Roles and permissions',
      href: '/guides/database/postgres/roles',
      description: 'The Postgres roles Supabase ships with and how to add your own.',
    },
  ],
}
