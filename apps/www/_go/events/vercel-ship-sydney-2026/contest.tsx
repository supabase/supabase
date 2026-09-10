import type { GoPageInput } from 'marketing'
import Link from 'next/link'
import { Button } from 'ui'

const page: GoPageInput = {
  template: 'lead-gen',
  slug: 'vercel-ship-sydney-2026/contest',
  metadata: {
    title: 'Win a MacBook Neo | Supabase at Vercel Ship Sydney 2026',
    description:
      'Vercel Eve gives your agent a brain. Supabase gives it a memory, an identity, and a rulebook. Thanks for meeting with us at Vercel Ship Sydney. Enter for a chance to win a MacBook Neo.',
  },
  hero: {
    title: 'Win a MacBook Neo',
    subtitle: 'Supabase at Vercel Ship Sydney 2026',
    description:
      'Vercel Eve gives your agent a brain. Supabase gives it a memory, an identity, and a rulebook: pgvector for memory, Auth for identity, and Row Level Security for what it can touch. No new database, no new permission model. Thanks for meeting with us at Vercel Ship Sydney. Sign up, load some data, and enter below for a chance to win a MacBook Neo.',
    image: {
      src: '/images/landing-pages/sxsw-2026/macbook-neo.png',
      alt: 'MacBook Neo in four colors',
      width: 500,
      height: 333,
    },
    ctas: [
      {
        label: 'Get started',
        href: '#how-to-enter',
        variant: 'primary',
      },
    ],
  },
  sections: [
    {
      type: 'single-column',
      id: 'how-to-enter',
      title: 'How to enter',
      children: (
        <div className="flex flex-col items-center gap-6">
          <ol className="flex flex-col gap-4 text-foreground-light text-lg list-decimal list-inside">
            <li>Create a Supabase account and note the email address you used</li>
            <li>Load data into a Supabase database</li>
            <li>Fill out the entry form below</li>
            <li>Complete these steps by the contest deadline</li>
          </ol>
          <Button asChild variant="default" size="medium">
            <Link href="https://supabase.com/dashboard">Create your account</Link>
          </Button>
          <p className="text-xs text-foreground-lighter mt-4">
            No purchase necessary. Void where prohibited.{' '}
            <Link href="/go/contest-rules" className="underline">
              Official rules
            </Link>
            .
          </p>
        </div>
      ),
    },
    {
      type: 'form',
      id: 'enter-contest',
      title: 'Enter the contest',
      description: 'Fill out the form below to complete your entry.',
      fields: [
        {
          type: 'text',
          name: 'first_name',
          label: 'First Name',
          placeholder: 'First Name',
          required: true,
          half: true,
        },
        {
          type: 'text',
          name: 'last_name',
          label: 'Last Name',
          placeholder: 'Last Name',
          required: true,
          half: true,
        },
        {
          type: 'email',
          name: 'email_address',
          label: 'Email',
          placeholder: 'Work email',
          required: true,
        },
        {
          type: 'text',
          name: 'company_name',
          label: 'Company',
          placeholder: 'Company name',
          required: true,
        },
        {
          type: 'text',
          name: 'job_title',
          label: 'Job Title',
          placeholder: 'VP of Engineering',
          required: false,
        },
      ],
      submitLabel: 'Enter contest',
      successRedirect: '/go/vercel-ship-sydney-2026/contest/thank-you',
      disclaimer:
        'By submitting this form, I confirm that I have read and understood the [Privacy Policy](https://supabase.com/privacy) and the [Official Rules](/go/contest-rules).',
      crm: {
        hubspot: {
          formGuid: 'e52b38eb-dd00-46e7-bdcc-b8e2aac87b2d',
          fieldMap: {
            first_name: 'firstname',
            last_name: 'lastname',
            email_address: 'email',
            company_name: 'company',
            job_title: 'jobtitle',
          },
          consent:
            'By submitting this form, I confirm that I have read and understood the Privacy Policy.',
        },
        notion: {
          database_id: 'ff9a5102510e4c87ad50c5d6197ddd29',
          columnMap: {
            first_name: 'First Name',
            last_name: 'Last Name',
            email_address: 'Email',
            company_name: 'Company',
            job_title: 'Job Title',
          },
        },
      },
    },
  ],
}

export default page
