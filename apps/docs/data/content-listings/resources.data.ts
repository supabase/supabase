import type { ContentListingGroup } from '~/lib/content-listings.schema'

export const resourcesOverview: ContentListingGroup = {
  id: 'resources-overview',
  type: 'grid',
  items: [
    {
      title: 'Examples',
      href: '/guides/getting-started',
      description: 'Official GitHub examples, curated content from the community, and more.',
    },
    {
      title: 'Glossary',
      href: '/guides/resources/glossary',
      description: 'Definitions for terminology and acronyms used in the Supabase documentation.',
    },
  ],
}

export const resourcesMigrate: ContentListingGroup = {
  id: 'resources-migrate',
  heading: 'Migrate to Supabase',
  headingLevel: 'h3',
  type: 'grid',
  items: [
    {
      title: 'Auth0',
      href: '/guides/platform/migrating-to-supabase/auth0',
      icon: '/docs/img/icons/auth0-icon',
      hasLightIcon: true,
      description: 'Move your auth users from Auth0 to a Supabase project.',
    },
    {
      title: 'Firebase Auth',
      href: '/guides/platform/migrating-to-supabase/firebase-auth',
      icon: '/docs/img/icons/firebase-icon',
      hasLightIcon: false,
      description: 'Move your auth users from a Firebase project to a Supabase project.',
    },
    {
      title: 'Firestore Data',
      href: '/guides/platform/migrating-to-supabase/firestore-data',
      icon: '/docs/img/icons/firebase-icon',
      hasLightIcon: false,
      description: 'Migrate the contents of a Firestore collection to a single Postgres table.',
    },
    {
      title: 'Firebase Storage',
      href: '/guides/platform/migrating-to-supabase/firebase-storage',
      icon: '/docs/img/icons/firebase-icon',
      hasLightIcon: false,
      description: 'Convert your Firebase Storage files to Supabase Storage.',
    },
    {
      title: 'Heroku',
      href: '/guides/platform/migrating-to-supabase/heroku',
      icon: '/docs/img/icons/heroku-icon',
      hasLightIcon: false,
      description: 'Migrate your Heroku Postgres database to Supabase.',
    },
    {
      title: 'Render',
      href: '/guides/platform/migrating-to-supabase/render',
      icon: '/docs/img/icons/render-icon',
      hasLightIcon: false,
      description: 'Migrate your Render Postgres database to Supabase.',
    },
    {
      title: 'Amazon RDS',
      href: '/guides/platform/migrating-to-supabase/amazon-rds',
      icon: '/docs/img/icons/aws-rds-icon',
      hasLightIcon: false,
      description: 'Migrate your Amazon RDS database to Supabase.',
    },
    {
      title: 'Postgres',
      href: '/guides/platform/migrating-to-supabase/postgres',
      icon: '/docs/img/icons/postgres-icon',
      hasLightIcon: false,
      description: 'Migrate your Postgres database to Supabase.',
    },
    {
      title: 'MySQL',
      href: '/guides/platform/migrating-to-supabase/mysql',
      icon: '/docs/img/icons/mysql-icon',
      hasLightIcon: false,
      description: 'Migrate your MySQL database to Supabase.',
    },
    {
      title: 'Microsoft SQL Server',
      href: '/guides/platform/migrating-to-supabase/mssql',
      icon: '/docs/img/icons/mssql-icon',
      hasLightIcon: false,
      description: 'Migrate your Microsoft SQL Server database to Supabase.',
    },
  ],
}

export const resourcesPostgres: ContentListingGroup = {
  id: 'resources-postgres',
  heading: 'Postgres resources',
  headingLevel: 'h3',
  type: 'grid',
  items: [
    {
      title: 'Managing Indexes',
      href: '/guides/database/postgres/indexes',
      description: 'Improve query performance using various index types in Postgres.',
    },
    {
      title: 'Cascade Deletes',
      href: '/guides/database/postgres/cascade-deletes',
      description: 'Understand the types of foreign key constraint deletes.',
    },
    {
      title: 'Drop all tables in schema',
      href: '/guides/database/postgres/dropping-all-tables-in-schema',
      description: 'Delete all tables in a given schema.',
    },
    {
      title: 'Select first row per group',
      href: '/guides/database/postgres/first-row-in-group',
      description: 'Retrieve the first row in each distinct group.',
    },
    {
      title: 'Print Postgres version',
      href: '/guides/database/postgres/which-version-of-postgres',
      description: 'Find out which version of Postgres you are running.',
    },
  ],
}
