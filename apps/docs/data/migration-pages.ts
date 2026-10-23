export interface MigrationPage {
  name: string
  icon: string
  url: `https://${string}`
  hasLightIcon?: boolean
}

export const MIGRATION_PAGES: MigrationPage[] = [
  {
    name: 'Auth0',
    icon: '/docs/img/icons/auth0-icon',
    url: 'https://supabase.com/kb/guides/migrate-from-auth0',
    hasLightIcon: true,
  },
  {
    name: 'Firebase Auth',
    icon: '/docs/img/icons/firebase-icon',
    url: 'https://supabase.com/kb/guides/migrate-from-firebase-auth',
  },
  {
    name: 'Firestore Data',
    icon: '/docs/img/icons/firebase-icon',
    url: 'https://supabase.com/kb/guides/migrate-from-firestore-data',
  },
  {
    name: 'Firebase Storage',
    icon: '/docs/img/icons/firebase-icon',
    url: 'https://supabase.com/kb/guides/migrate-from-firebase-storage',
  },
  {
    name: 'Heroku',
    icon: '/docs/img/icons/heroku-icon',
    url: 'https://supabase.com/kb/guides/migrate-from-heroku',
  },
  {
    name: 'Render',
    icon: '/docs/img/icons/render-icon',
    url: 'https://supabase.com/kb/guides/migrate-from-render',
  },
  {
    name: 'Amazon RDS',
    icon: '/docs/img/icons/aws-rds-icon',
    url: 'https://supabase.com/kb/guides/migrate-from-amazon-rds',
  },
  {
    name: 'Postgres',
    icon: '/docs/img/icons/postgres-icon',
    url: 'https://supabase.com/kb/guides/migrate-from-postgres',
  },
  {
    name: 'Vercel Postgres',
    icon: '/docs/img/icons/vercel-icon',
    url: 'https://supabase.com/kb/guides/vercel-postgres',
    hasLightIcon: true,
  },
  {
    name: 'Neon',
    icon: '/docs/img/icons/neon-icon',
    url: 'https://supabase.com/kb/guides/migrate-from-neon',
    hasLightIcon: true,
  },
  {
    name: 'MySQL',
    icon: '/docs/img/icons/mysql-icon',
    url: 'https://supabase.com/kb/guides/migrate-from-mysql',
  },
  {
    name: 'MSSQL',
    icon: '/docs/img/icons/mssql-icon',
    url: 'https://supabase.com/kb/guides/migrate-from-mssql',
  },
]
