import type { GoPageInput } from 'marketing'
import Link from 'next/link'
import { Button } from 'ui'

const page: GoPageInput = {
  template: 'lead-gen',
  slug: 'pgworld-sjc-2026/contest',
  metadata: {
    title: 'Win an iPhone Pro Max | Supabase at Postgres World 2026',
    description:
      'Sign up for Supabase and enter the contest for a chance to win an iPhone Pro Max. Postgres World San Jose 2026.',
  },
  hero: {
    title: 'Win an iPhone Pro Max',
    subtitle: 'Supabase at Postgres World 2026',
    description:
      "Supabase is Postgres with batteries included -- auth, storage, edge functions, vectors, and real-time, all built on top of the database you already know. Sign up, load some data, and enter below for a chance to win an iPhone Pro Max.",
    image: {
      src: '/images/landing-pages/stripe-sessions/iphone17-pro-max.png',
      alt: 'iPhone Pro Max',
      width: 400,
      height: 500,
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
            <li>Complete these steps by Monday, May 4, 2026 at 12:00 PM PST</li>
          </ol>
          <Button asChild type="default" size="medium">
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
          placeholder: 'Email address',
          required: true,
        },
        {
          type: 'text',
          name: 'company_name',
          label: 'Company',
          placeholder: 'Company name',
          required: true,
        },
      ],
      submitLabel: 'Enter contest',
      successRedirect: '/go/pgworld-sjc-2026/contest/thank-you',
      disclaimer:
        'By submitting this form, I confirm that I have read and understood the [Privacy Policy](https://supabase.com/privacy) and the [Official Rules](/go/contest-rules).',
      crm: {
        hubspot: {
          formGuid: 'PLACEHOLDER_HUBSPOT_FORM_GUID',
          fieldMap: {
            first_name: 'firstname',
            last_name: 'lastname',
            email_address: 'email',
            company_name: 'company',
          },
          consent:
            'By submitting this form, I confirm that I have read and understood the Privacy Policy.',
        },
        customerio: {
          event: 'contest_entered',
          profileMap: {
            email_address: 'email',
            first_name: 'first_name',
            last_name: 'last_name',
            company_name: 'company_name',
          },
          staticProperties: {
            event_name: 'Postgres World San Jose 2026',
          },
        },
      },
    },
  ],
}

export default page
