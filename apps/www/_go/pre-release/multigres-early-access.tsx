import type { GoPageInput } from 'marketing'

const page: GoPageInput = {
  template: 'lead-gen',
  slug: 'multigres-early-access',
  metadata: {
    title: 'Multigres private alpha - Request access',
    description:
      'Request access to the Multigres private alpha on Supabase. Get multi-node high availability for Postgres, built by the team behind Vitess.',
    ogImage: '/images/blog/multigres/multigres.png',
  },
  hero: {
    title: 'Multigres on Supabase',
    subtitle: 'Private alpha',
    description:
      'Get multi-node high availability for Postgres, built by the team behind Vitess. The private alpha is by invite.',
    image: {
      src: '/images/blog/multigres/multigres.png',
      alt: 'Multigres',
      width: 1200,
      height: 800,
    },
    ctas: [
      {
        label: 'Request access',
        href: '#form',
        variant: 'primary',
      },
      {
        label: 'Read the announcement',
        href: '/blog/select-2026-scale-without-limits',
        variant: 'secondary',
      },
    ],
  },
  sections: [
    {
      type: 'feature-grid',
      className: 'border-y border-muted bg-surface-75 py-16 sm:py-24',
      title: 'Multi-node high availability for Postgres',
      description: 'It works with Supabase Auth, Storage, and Edge Functions.',
      columns: 3,
      items: [
        {
          title: 'Three nodes across zones',
          description:
            'Each Multigres cluster runs three nodes across availability zones in one region.',
        },
        {
          title: 'Failover in seconds',
          description:
            'When a node fails, Multigres promotes a replica in seconds. Committed writes survive.',
        },
        {
          title: 'No code changes',
          description: "You don't need to change your application code to move to Multigres.",
        },
      ],
    },
    {
      type: 'form',
      id: 'form',
      className: 'pt-4 pb-16 sm:pt-8 sm:pb-24',
      title: 'Request access to the Multigres private alpha',
      description:
        "This form is for the Supabase-managed Multigres private alpha, not the open-source Multigres project. The alpha is for testing, not production use, and it comes with no guarantees on data, availability, or support. During the alpha, Realtime, point-in-time recovery, and logical replication aren't available, and our team adds read replicas and gateways for you. If your organization is selected, we'll reach out with next steps.",
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
      ],
      submitLabel: 'Request access',
      successRedirect: '/go/multigres-early-access/thank-you',
      disclaimer:
        'By submitting this form, I confirm that I have read and understood the [Privacy Policy](https://supabase.com/privacy).',
      crm: {
        notion: {
          database_id: 'e345167c699f459bad511549f6cb993a',
          columnMap: {
            email: 'Email',
            org_slug: 'Organization Slug',
          },
        },
      },
    },
  ],
}

export default page
