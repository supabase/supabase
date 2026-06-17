import type { GoPageInput } from 'marketing'

const page: GoPageInput = {
  template: 'lead-gen',
  slug: 'external-replication-destinations',
  metadata: {
    title: 'External Replication Destinations — Early Access',
    description:
      'Request early access to ClickHouse, Snowflake, and DuckLake destinations for External Replication.',
    ogImage: '/images/blog/2025-12-02-introducing-supabase-etl/og.png',
  },
  hero: {
    title: 'External Replication destinations',
    subtitle: 'Early Access',
    description:
      'Replicate your Supabase Postgres data to the analytical systems your team already uses. Request early access to upcoming ClickHouse, Snowflake, and DuckLake destinations.',
    image: {
      src: '/images/blog/2025-12-02-introducing-supabase-etl/thumb.png',
      alt: 'Supabase ETL moving Postgres changes to analytical destinations',
      width: 2400,
      height: 1600,
    },
    ctas: [
      {
        label: 'Request Early Access',
        href: '#form',
        variant: 'primary',
      },
    ],
  },
  sections: [
    {
      type: 'feature-grid',
      title: 'Bring Supabase Postgres into your analytics stack',
      description:
        'External Replication keeps your application workload on Postgres while moving production data into systems built for analytics.',
      columns: 3,
      items: [
        {
          title: 'ClickHouse',
          description:
            'Stream operational data into ClickHouse for high-volume analytical queries, dashboards, and event workloads.',
        },
        {
          title: 'Snowflake',
          description:
            'Replicate Supabase Postgres data into Snowflake for warehouse analytics, BI, and governed data workflows.',
        },
        {
          title: 'DuckLake',
          description:
            'Move data into an open lakehouse destination for portable analytics and long-term data workflows.',
        },
      ],
    },
    {
      type: 'form',
      id: 'form',
      title: 'Early Access Request Form',
      description:
        "If you're interested in trying upcoming External Replication destinations as they become available, select the destinations your team uses and share your Supabase organization slug. A member of the Supabase team may reach out if your workspace is a fit.",
      fields: [
        {
          type: 'email',
          name: 'email',
          label: 'Email Address',
          placeholder: 'Work email',
          required: true,
        },
        {
          type: 'text',
          name: 'org_slug',
          label: 'Supabase Organization Slug',
          placeholder: 'acme-inc',
          description: 'Use the slug from your Supabase Dashboard URL, for example /org/acme-inc.',
          required: true,
        },
        {
          type: 'checkbox',
          name: 'destination_clickhouse',
          label: 'ClickHouse',
          description:
            'For high-throughput analytical queries, event data, logs, and dashboard workloads.',
          group: 'requested_destinations',
          groupRequired: true,
        },
        {
          type: 'checkbox',
          name: 'destination_snowflake',
          label: 'Snowflake',
          description: 'For teams running warehouse analytics, BI, or governed data workflows.',
          group: 'requested_destinations',
          groupRequired: true,
        },
        {
          type: 'checkbox',
          name: 'destination_ducklake',
          label: 'DuckLake',
          description:
            'For open lakehouse workflows where you want portable data and flexible analytics.',
          group: 'requested_destinations',
          groupRequired: true,
        },
      ],
      submitLabel: 'Request Early Access',
      successRedirect: '/go/external-replication-destinations/thank-you',
      disclaimer:
        'By submitting this form, I confirm that I have read and understood the [Privacy Policy](https://supabase.com/privacy).',
      crm: {
        notion: {
          database_id: '3825004b775f80828179e7bdd7ee4b8d',
          columnMap: {
            email: 'Email',
            org_slug: 'Organization Slug',
            destination_clickhouse: 'ClickHouse',
            destination_snowflake: 'Snowflake',
            destination_ducklake: 'DuckLake',
          },
        },
      },
    },
    {
      type: 'three-column',
      title: 'Suggested reading',
      description: 'Get the product context and setup details behind External Replication.',
      children: (
        <>
          <a
            href="/blog/introducing-supabase-etl"
            className="group flex h-full flex-col gap-3 rounded-lg border border-muted bg-surface-100 p-5 text-left transition-colors hover:bg-surface-200"
          >
            <span className="text-sm text-foreground-lighter">Blog</span>
            <span className="text-lg font-medium text-foreground group-hover:text-brand-link">
              Introducing Supabase ETL
            </span>
            <span className="text-sm leading-relaxed text-foreground-light">
              Learn how the CDC pipeline moves Postgres changes to analytical destinations in near
              real time.
            </span>
          </a>
          <a
            href="/docs/guides/database/replication/external-replication-setup"
            className="group flex h-full flex-col gap-3 rounded-lg border border-muted bg-surface-100 p-5 text-left transition-colors hover:bg-surface-200"
          >
            <span className="text-sm text-foreground-lighter">Docs</span>
            <span className="text-lg font-medium text-foreground group-hover:text-brand-link">
              Set up External Replication
            </span>
            <span className="text-sm leading-relaxed text-foreground-light">
              Review publications, destination setup, monitoring, and how pipelines are managed from
              the Dashboard.
            </span>
          </a>
          <a
            href="/blog/realtime-or-etl-how-to-choose-the-right-tool"
            className="group flex h-full flex-col gap-3 rounded-lg border border-muted bg-surface-100 p-5 text-left transition-colors hover:bg-surface-200"
          >
            <span className="text-sm text-foreground-lighter">Guide</span>
            <span className="text-lg font-medium text-foreground group-hover:text-brand-link">
              Realtime or ETL?
            </span>
            <span className="text-sm leading-relaxed text-foreground-light">
              Compare live user experiences over WebSocket with reliable data movement into
              analytical systems.
            </span>
          </a>
        </>
      ),
    },
  ],
}

export default page
