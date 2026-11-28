import type { GoPageInput } from 'marketing'
import { Button } from 'ui'

export const postgresToWarehouse: GoPageInput = {
  template: 'lead-gen',
  slug: 'postgres-to-warehouse',
  metadata: {
    title: 'Move Postgres data into your warehouse',
    description:
      'Stream Supabase Postgres data to BigQuery, ClickHouse, DuckLake, or Snowflake with Pipelines for reporting and analytics.',
    noIndex: true,
  },
  hero: {
    title: 'Move Postgres data into your warehouse',
    subtitle: 'Supabase Pipelines · Public alpha',
    description:
      'Stream Supabase Postgres data to BigQuery, ClickHouse, DuckLake, or Snowflake for reporting and analytics.',
    ctas: [
      {
        label: 'Start your project',
        href: 'https://supabase.com/dashboard/sign-up',
        variant: 'primary',
      },
      {
        label: 'Read the Pipelines guide',
        href: 'https://supabase.com/docs/guides/database/replication/pipelines',
        variant: 'secondary',
      },
    ],
    supportingLink: {
      label: 'Check availability and requirements →',
      href: 'https://supabase.com/docs/guides/database/replication/pipelines-faq',
    },
  },
  sections: [
    {
      type: 'feature-grid',
      title: 'App data for your analytics stack',
      columns: 2,
      items: [
        {
          title: 'Separate analytics from app queries',
          description:
            'Run reporting and analytical queries in your destination while Supabase Postgres serves your app.',
        },
        {
          title: 'Copy existing data, then stream changes',
          description:
            'Start with an initial copy of selected tables, then replicate new changes in near real time.',
        },
        {
          title: 'Choose the data to replicate',
          description:
            'Select the tables your analytics needs with a Postgres publication. Configure your destination in the Supabase Dashboard.',
        },
        {
          title: 'Monitor a managed pipeline',
          description:
            'Supabase runs the pipeline. Track replication lag, table progress, and errors from the Dashboard.',
        },
      ],
    },
    {
      type: 'steps',
      title: 'Connect your database to your destination',
      items: [
        {
          title: 'Prepare your destination',
          description:
            'Choose BigQuery, ClickHouse, DuckLake, or Snowflake. Follow its guide for credentials, table requirements, and how replicated data is stored.',
        },
        {
          title: 'Select your source tables',
          description:
            'Create or choose a Postgres publication, configure the destination, and select which tables need an initial copy.',
        },
        {
          title: 'Start and monitor',
          description:
            'Review validation results and estimated charges, then start the pipeline. Check sync progress and replication lag in the Dashboard.',
        },
      ],
    },
    {
      type: 'single-column',
      title: 'Put your app’s data to work',
      description:
        'Build your app on Supabase Postgres and use Pipelines to feed your analytics. Already have a project? Follow the setup guide to check access and configure your destination.',
      children: (
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex flex-wrap justify-center gap-4">
            <Button asChild variant="primary" size="medium">
              <a href="https://supabase.com/dashboard/sign-up">Start your project</a>
            </Button>
            <Button asChild variant="default" size="medium">
              <a href="https://supabase.com/docs/guides/database/replication/pipelines">
                Read the Pipelines guide
              </a>
            </Button>
          </div>
          <a
            href="https://supabase.com/docs/guides/database/replication/pipelines-faq"
            className="text-sm text-foreground-light underline underline-offset-4 hover:text-foreground"
          >
            Check availability and requirements →
          </a>
        </div>
      ),
    },
  ],
}
