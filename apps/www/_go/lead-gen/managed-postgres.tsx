import type { GoPageInput } from 'marketing'
import { Button } from 'ui'

export const managedPostgres: GoPageInput = {
  template: 'lead-gen',
  slug: 'managed-postgres',
  metadata: {
    title: 'Managed Postgres for your app',
    description:
      'Keep your Postgres tools and run your database on Supabase, with connection pooling, daily backups on paid plans, and optional point-in-time recovery.',
    noIndex: true,
  },
  hero: {
    title: 'Keep your stack. Run Postgres on Supabase.',
    description:
      'Use the Postgres tools you already know, with connection pooling included. Get daily backups on paid plans, or add point-in-time recovery for more precise restores.',
    ctas: [
      {
        label: 'Start your project',
        href: 'https://supabase.com/dashboard/sign-up',
        variant: 'primary',
      },
      {
        label: 'Read the Postgres docs',
        href: 'https://supabase.com/docs/guides/database/overview',
        variant: 'secondary',
      },
    ],
  },
  sections: [
    {
      type: 'feature-grid',
      title: 'The Postgres you know, with tools to operate it',
      columns: 2,
      items: [
        {
          title: 'Keep your Postgres tools',
          description:
            'Connect your app, SQL client, or ORM to a full Postgres database using a standard connection string.',
        },
        {
          title: 'Connection pooling included',
          description:
            'Use the built-in connection pooler to share database connections across your app. Choose session or transaction mode to suit your workload.',
        },
        {
          title: 'Daily backups on paid plans',
          description:
            'Supabase automatically backs up your database each day on Pro, Team, and Enterprise plans. Restore an available backup from the dashboard.',
        },
        {
          title: 'Optional point-in-time recovery',
          description:
            'Restore your database to a point before an accidental change within your recovery window. Available as a paid add-on on Pro, Team, and Enterprise plans, with Small compute or larger.',
        },
      ],
    },
    {
      type: 'single-column',
      title: 'Choose the recovery window your app needs',
      description:
        'Daily backups give you a saved state to return to. Enable point-in-time recovery when you need to restore to a specific moment between those snapshots.',
      children: (
        <div className="flex flex-col items-center gap-4 text-center">
          <Button asChild variant="default" size="medium">
            <a href="https://supabase.com/docs/guides/platform/backups">
              Explore backups and recovery
            </a>
          </Button>
          <p className="max-w-xl text-sm text-foreground-light">
            Point-in-time recovery replaces daily backups. Your database is unavailable during a
            restore. Database backups do not include files stored through the Storage API.
          </p>
          <a
            href="https://supabase.com/pricing"
            className="text-sm text-foreground-light underline underline-offset-4 hover:text-foreground"
          >
            View plans and add-ons →
          </a>
        </div>
      ),
    },
    {
      type: 'single-column',
      title: 'Bring your app to Supabase Postgres',
      description:
        'Create a project, connect your existing tools, and choose the backup and recovery options your app needs.',
      children: (
        <div className="flex justify-center">
          <Button asChild variant="primary" size="medium">
            <a href="https://supabase.com/dashboard/sign-up">Start your project</a>
          </Button>
        </div>
      ),
    },
  ],
}
