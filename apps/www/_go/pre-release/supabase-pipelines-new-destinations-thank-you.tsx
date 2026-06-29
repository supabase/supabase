import type { GoPageInput } from 'marketing'

const page: GoPageInput = {
  template: 'thank-you',
  slug: 'supabase-pipelines-new-destinations/thank-you',
  metadata: {
    title: 'Supabase Pipelines destination request received',
    description: 'Thanks for requesting early access to upcoming Supabase Pipelines destinations.',
    ogImage: '/images/blog/2025-12-02-introducing-supabase-pipelines/og.png',
  },
  hero: {
    title: 'Thanks for your request',
    subtitle: 'Early Access',
    description:
      'We received your Supabase Pipelines destination preferences. A member of the Supabase team may reach out if your workspace is a fit for early access to ClickHouse, Snowflake, or DuckLake.',
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
