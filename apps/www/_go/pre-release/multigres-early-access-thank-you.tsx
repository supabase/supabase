import type { GoPageInput } from 'marketing'

const page: GoPageInput = {
  template: 'thank-you',
  slug: 'multigres-early-access/thank-you',
  metadata: {
    title: 'Multigres private alpha request received',
    description: 'Thanks for requesting access to the Multigres private alpha.',
    ogImage: '/images/blog/multigres/multigres.png',
  },
  hero: {
    title: 'Thanks for your request',
    subtitle: 'Private alpha',
    description:
      "We got your request for the Multigres private alpha. If your organization is selected, we'll reach out with next steps.",
    ctas: [
      {
        label: 'Read the announcement',
        href: '/blog/select-2026-scale-without-limits',
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
