import type { GoPageInput } from 'marketing'

const page: GoPageInput = {
  template: 'thank-you',
  slug: 'warehouse-early-access/thank-you',
  metadata: {
    title: 'Supabase Warehouse private alpha request received',
    description: 'Thanks for requesting access to the Supabase Warehouse private alpha.',
    // TODO: Placeholder image. Replace with the Warehouse launch image.
    ogImage: '/images/og/supabase-og.png',
  },
  hero: {
    title: 'Thanks for your request',
    subtitle: 'Private alpha',
    description:
      "We got your request for the Supabase Warehouse private alpha. If your organization is selected, we'll reach out with next steps.",
    ctas: [
      {
        label: 'Read the announcement',
        // TODO: Placeholder URL. Update once the Warehouse announcement post is published.
        href: '/blog/introducing-supabase-warehouse',
        variant: 'secondary',
      },
      {
        label: 'Back to Supabase',
        href: '/',
        variant: 'secondary',
      },
    ],
  },
}

export default page
