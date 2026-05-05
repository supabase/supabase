import type { GoPageInput } from 'marketing'

import HubSpotFormEmbed from './components/HubSpotFormEmbed'

const page: GoPageInput = {
  template: 'lead-gen',
  slug: 'aws-activate-offer',
  metadata: {
    title: 'Get $300 in Supabase credits through AWS Activate',
    description:
      'Exclusively for VC-backed startups accessing Supabase through AWS Activate. Apply to receive $300 in Supabase credits.',
    noIndex: true,
  },
  hero: {
    title: 'Get $300 in Supabase credits through AWS Activate',
    description:
      'This offer is exclusively for VC-backed startups accessing Supabase through AWS Activate. Complete the form below to apply.',
    image: {
      src: 'https://zhfonblqamxferhoguzj.supabase.co/functions/v1/generate-og?template=partnerships&layout=icon-only&copy=%5B%24300%5D+in+credits+for%0AAWS+Activate+startups&icon=supabase.svg&icon2=aws.svg',
      alt: 'Supabase and AWS Activate: $300 in credits for eligible startups',
      width: 600,
      height: 315,
    },
    ctas: [
      {
        label: 'Apply for your credits',
        href: '#form',
        variant: 'primary',
      },
    ],
  },
  sections: [
    {
      type: 'single-column',
      title: 'About the offer',
      description:
        'Supabase is the easy-to-use, open-source managed Postgres with integrated backend services. With this exclusive AWS Activate offer, eligible startups receive $300 in Supabase credits to build, scale, and ship faster.',
    },
    {
      type: 'feature-grid',
      title: 'What the credits unlock',
      description: 'An all-in-one suite built on Postgres. Use one or all.',
      columns: 3,
      items: [
        {
          title: 'Database',
          description: 'A full Postgres instance hosted in the cloud.',
        },
        {
          title: 'Auth',
          description:
            'A complete user management system with email, social, and passwordless login.',
        },
        {
          title: 'Storage',
          description: 'Upload and serve files of any size.',
        },
        {
          title: 'Edge Functions',
          description: 'Server-side TypeScript functions, distributed globally at the edge.',
        },
        {
          title: 'Realtime',
          description: 'Live sync for collaborative applications, powered by Postgres replication.',
        },
        {
          title: 'Vector',
          description: 'pgvector for fast semantic search and embedding storage.',
        },
      ],
    },
    {
      type: 'steps',
      title: 'Eligibility requirements',
      description: 'To qualify for this offer you must:',
      items: [
        { title: 'Be a VC-backed startup with less than $5M in total funding' },
        { title: 'Have an active AWS account' },
        { title: 'Not have previously redeemed this offer' },
      ],
    },
    {
      type: 'faq',
      title: 'Frequently asked questions',
      items: [
        {
          question: 'Who is this offer for?',
          answer:
            'VC-backed startups with less than $5M in total funding and an active AWS account.',
        },
        {
          question: 'What can I use the credits for?',
          answer:
            'Credits apply to any Supabase product including database, auth, storage, and edge functions.',
        },
        {
          question: 'How long does it take to hear back?',
          answer:
            "We review applications within 5 business days. You'll receive a confirmation email once submitted.",
        },
        {
          question: 'What happens after I apply?',
          answer:
            'If your application is approved, a member of our team will reach out to activate your credits.',
        },
      ],
    },
    {
      type: 'single-column',
      id: 'form',
      title: 'Apply for your credits',
      children: (
        <div className="mx-auto w-full max-w-2xl border border-muted rounded-2xl p-6 sm:p-8">
          <HubSpotFormEmbed portalId="19953346" formId="db2718f8-1f23-4fe1-aaab-b4924dc4ca54" />
        </div>
      ),
    },
  ],
}

export default page
