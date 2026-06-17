import type { GoPageInput } from 'marketing'

const page: GoPageInput = {
  template: 'thank-you',
  slug: 'external-replication-destinations/thank-you',
  metadata: {
    title: 'External Replication destination request received',
    description:
      'Thanks for requesting early access to upcoming External Replication destinations.',
    ogImage: '/images/blog/2025-12-02-introducing-supabase-etl/og.png',
  },
  hero: {
    title: 'Thanks for your request',
    subtitle: 'Early Access',
    description:
      'We received your destination preferences. A member of the Supabase team may reach out if your workspace is a fit for early access to ClickHouse, Snowflake, or DuckLake.',
    ctas: [
      {
        label: 'Back to Supabase',
        href: '/',
        variant: 'secondary',
      },
    ],
  },
}

export default page
