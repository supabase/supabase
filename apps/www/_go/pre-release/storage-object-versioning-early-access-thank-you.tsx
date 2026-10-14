import type { GoPageInput } from 'marketing'

const page: GoPageInput = {
  template: 'thank-you',
  slug: 'storage-object-versioning-early-access/thank-you',
  metadata: {
    title: 'Object Versioning private alpha request received',
    description:
      'Thanks for requesting access to the Storage Object Versioning and Lifecycle Policies private alpha.',
  },
  hero: {
    title: 'Thanks for your request',
    subtitle: 'Private alpha',
    description:
      "We got your request for the Storage Object Versioning and Lifecycle Policies private alpha. If your project is selected, we'll reach out with next steps.",
    ctas: [
      {
        label: 'Read the documentation',
        href: '/docs/guides/storage/buckets/object-versioning',
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
