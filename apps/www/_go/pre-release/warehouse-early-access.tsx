import type { GoPageInput } from 'marketing'

const page: GoPageInput = {
  template: 'lead-gen',
  slug: 'warehouse-early-access',
  metadata: {
    title: 'Supabase Warehouse private alpha - Request access',
    description:
      'Request access to the Supabase Warehouse private alpha. Replicate your Postgres tables to columnar storage that stays in sync, and query them from DuckDB or Arrow Flight SQL.',
    // TODO: Placeholder image. Replace with the Warehouse launch image.
    ogImage: '/images/og/supabase-og.png',
  },
  hero: {
    title: 'Supabase Warehouse',
    subtitle: 'Private alpha',
    description:
      'Replicate the Postgres tables you choose to columnar storage that stays in sync, and query them from DuckDB or any Arrow Flight SQL client. The private alpha is by invite.',
    ctas: [
      {
        label: 'Request access',
        href: '#form',
        variant: 'primary',
      },
      {
        label: 'Read the announcement',
        // TODO: Placeholder URL. Update once the Warehouse announcement post is published.
        href: '/blog/introducing-supabase-warehouse',
        variant: 'secondary',
      },
    ],
  },
  sections: [
    {
      type: 'feature-grid',
      className: 'border-y border-muted bg-surface-75 py-16 sm:py-24',
      title: 'Analytics on your Postgres data',
      description:
        'Your database keeps serving your app while Warehouse answers analytical queries.',
      columns: 3,
      items: [
        {
          title: 'Pick the tables to replicate',
          description:
            'Choose schemas and tables in the Dashboard. Warehouse copies existing rows, then streams new changes as they happen.',
        },
        {
          title: 'Keep analytics off Postgres',
          description:
            'Analytical queries run against the Warehouse copy, not your production database.',
        },
        {
          title: 'Query with open tools',
          description:
            'Data is stored in the open DuckLake format. Query it from DuckDB or any Arrow Flight SQL client.',
        },
      ],
    },
    {
      type: 'form',
      id: 'form',
      className: 'py-4 sm:py-8',
      title: 'Request access to the Supabase Warehouse private alpha',
      description:
        "The alpha is for testing, not production use, and it comes with no guarantees on data, availability, or support. If your organization is selected, we'll reach out with next steps.",
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
          description: 'Use the slug from your Supabase dashboard URL, for example /org/acme-inc.',
          required: true,
        },
        {
          type: 'textarea',
          name: 'use_case',
          label: 'Tell us about your analytics use case',
          placeholder:
            'For example: internal dashboards over event data that are too slow on Postgres today',
          description:
            'Include what you want to analyze, the queries you run today, and which tools will query the data.',
          rows: 5,
          required: true,
        },
        {
          type: 'select',
          name: 'data_volume',
          label: 'How much data do you plan to replicate to Supabase Warehouse?',
          placeholder: 'Select a range',
          description: 'Total size of the tables you want to replicate. An estimate is fine.',
          required: true,
          options: [
            { label: 'Less than 1 GB', value: 'Less than 1 GB' },
            { label: 'Less than 10 GB', value: 'Less than 10 GB' },
            { label: 'Less than 100 GB', value: 'Less than 100 GB' },
            { label: 'Less than 1 TB', value: 'Less than 1 TB' },
            { label: 'More than 1 TB', value: 'More than 1 TB' },
          ],
        },
      ],
      submitLabel: 'Request access',
      successRedirect: '/go/warehouse-early-access/thank-you',
      disclaimer:
        'By submitting this form, I confirm that I have read and understood the [Privacy Policy](https://supabase.com/privacy).',
      crm: {
        notion: {
          database_id: '29b0b7ac143449479f256ea5f16c5862',
          columnMap: {
            email: 'Email',
            org_slug: 'Organization Slug',
            use_case: 'Use Case',
            data_volume: 'Data Volume',
          },
        },
      },
    },
    {
      type: 'two-column',
      className: 'pb-16 sm:pb-24',
      title: 'Suggested reading',
      description: 'Get the product context and setup details behind Supabase Warehouse.',
      children: (
        <>
          {/* TODO: Placeholder URL. Update once the Warehouse announcement post is published. */}
          <a
            href="/blog/introducing-supabase-warehouse"
            className="group flex h-full flex-col gap-3 rounded-lg border border-muted bg-surface-100 p-5 text-left transition-colors hover:border-brand-600 hover:bg-surface-200"
          >
            <span className="text-sm text-foreground-lighter">Blog</span>
            <span className="text-lg font-medium text-foreground group-hover:text-primary">
              Introducing Supabase Warehouse
            </span>
            <span className="text-sm leading-relaxed text-foreground-light">
              What Warehouse does, how it works, and what the private alpha includes.
            </span>
          </a>
          {/* TODO: Placeholder URL. Update once the Warehouse docs are published. */}
          <a
            href="/docs/guides/warehouse"
            className="group flex h-full flex-col gap-3 rounded-lg border border-muted bg-surface-100 p-5 text-left transition-colors hover:border-brand-600 hover:bg-surface-200"
          >
            <span className="text-sm text-foreground-lighter">Docs</span>
            <span className="text-lg font-medium text-foreground group-hover:text-primary">
              Set up Warehouse
            </span>
            <span className="text-sm leading-relaxed text-foreground-light">
              Choose the tables to replicate, check their replication status, and connect DuckDB or
              an Arrow Flight SQL client.
            </span>
          </a>
        </>
      ),
    },
  ],
}

export default page
