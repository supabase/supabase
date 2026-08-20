import type { GoPageInput } from 'marketing'

const page: GoPageInput = {
  template: 'lead-gen',
  slug: 'supabase-pipelines-new-destinations',
  metadata: {
    title: 'Supabase Pipelines Destinations - Early Access',
    description:
      'Request early access to upcoming Supabase Pipelines destinations for ClickHouse, Snowflake, and DuckLake.',
    ogImage: '/images/blog/2025-12-02-introducing-supabase-pipelines/og.png',
  },
  hero: {
    title: 'Supabase Pipelines destinations',
    subtitle: 'Early Access',
    description:
      "Managed change-data-capture pipelines that replicate your Supabase Postgres data to analytical systems in near real time. Request early access to the destinations we're adding next: ClickHouse, Snowflake, and DuckLake.",
    image: {
      src: '/images/blog/2025-12-02-introducing-supabase-pipelines/thumb.png',
      alt: 'Introducing Supabase Pipelines',
      width: 2400,
      height: 1260,
    },
    ctas: [
      {
        label: 'Request early access',
        href: '#form',
        variant: 'primary',
      },
      {
        label: 'Read the announcement',
        href: '/blog/introducing-supabase-pipelines',
        variant: 'secondary',
      },
    ],
  },
  sections: [
    {
      type: 'feature-grid',
      className: 'border-y border-muted bg-surface-75 py-16 sm:py-24',
      title: 'Bring Supabase Postgres into your analytics stack',
      description:
        'Pipelines keeps your application workload on Postgres while ongoing replication sends production changes to systems built for analytics, reporting, and lakehouse workflows.',
      columns: 3,
      items: [
        {
          title: 'ClickHouse',
          description:
            'Replicate operational data into ClickHouse for high-volume analytical queries, dashboards, and event workloads.',
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
      className: 'py-4 sm:py-8',
      title: 'Request early access to new Pipelines destinations',
      description:
        "This form is for early access to upcoming destinations for Supabase Pipelines, not access to Supabase Pipelines itself. Tell us which destinations your team wants to use. If your workspace is selected, we'll reach out with next steps.",
      fields: [
        {
          type: 'email',
          name: 'email',
          label: 'Email address',
          placeholder: 'Work email',
          required: true,
        },
        {
          type: 'text',
          name: 'org_slug',
          label: 'Supabase organization slug',
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
      submitLabel: 'Request destination access',
      successRedirect: '/go/supabase-pipelines-new-destinations/thank-you',
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
      className: 'pb-16 sm:pb-24',
      title: 'Suggested reading',
      description: 'Get the product context and setup details behind Supabase Pipelines.',
      children: (
        <>
          <a
            href="/blog/introducing-supabase-pipelines"
            className="group flex h-full flex-col gap-3 rounded-lg border border-muted bg-surface-100 p-5 text-left transition-colors hover:border-brand-600 hover:bg-surface-200"
          >
            <span className="text-sm text-foreground-lighter">Blog</span>
            <span className="text-lg font-medium text-foreground group-hover:text-brand-link">
              Introducing Supabase Pipelines
            </span>
            <span className="text-sm leading-relaxed text-foreground-light">
              Learn how managed CDC pipelines move Postgres changes to analytical destinations in
              near real time.
            </span>
          </a>
          <a
            href="/docs/guides/database/replication/pipelines"
            className="group flex h-full flex-col gap-3 rounded-lg border border-muted bg-surface-100 p-5 text-left transition-colors hover:border-brand-600 hover:bg-surface-200"
          >
            <span className="text-sm text-foreground-lighter">Docs</span>
            <span className="text-lg font-medium text-foreground group-hover:text-brand-link">
              Set up Pipelines
            </span>
            <span className="text-sm leading-relaxed text-foreground-light">
              Review publications, destination setup, monitoring, and how pipelines are managed from
              the Dashboard.
            </span>
          </a>
          <a
            href="/blog/realtime-or-pipelines-how-to-choose-the-right-tool"
            className="group flex h-full flex-col gap-3 rounded-lg border border-muted bg-surface-100 p-5 text-left transition-colors hover:border-brand-600 hover:bg-surface-200"
          >
            <span className="text-sm text-foreground-lighter">Guide</span>
            <span className="text-lg font-medium text-foreground group-hover:text-brand-link">
              Realtime or Pipelines?
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
