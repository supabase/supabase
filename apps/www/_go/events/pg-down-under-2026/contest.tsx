import type { GoPageInput } from 'marketing'
import Link from 'next/link'
import { Button } from 'ui'

const page: GoPageInput = {
  template: 'lead-gen',
  slug: 'pg-down-under-2026/contest',
  metadata: {
    title: 'Win AirPods Pro 3 | Supabase at PG Down Under 2026',
    description:
      'Enter the raffle for a chance to win a set of AirPods Pro 3. Try Supabase: Postgres with auth, storage, edge functions, vectors and real-time.',
  },
  hero: {
    title: 'Your chance to win a set of AirPods Pro 3',
    subtitle: 'Supabase at PG Down Under 2026',
    description:
      'Try Supabase. Postgres with batteries included: auth, storage, edge functions, vectors and real-time, all built on top of the database you already know.',
    image: {
      src: '/images/landing-pages/pg-down-under-2026/airpods-pro-3.png',
      alt: 'Apple AirPods Pro 3 with charging case',
      width: 400,
      height: 375,
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
            <li>Collect your raffle ticket from the Supabase team</li>
          </ol>
          <div className="flex flex-col items-center gap-2 text-center text-foreground-light text-lg">
            <p>Complete these steps by the raffle deadline, 2:45 PM AEDT on October 30, 2026.</p>
            <p>
              The winner will be drawn onsite at 3:00 PM AEDT on October 30, 2026 at the Supabase
              stand.
            </p>
          </div>
          <Button asChild size="medium">
            <a href="https://supabase.com/dashboard">Create your account</a>
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
      title: 'Enter the raffle',
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
      submitLabel: 'Enter raffle',
      successRedirect: '/go/pg-down-under-2026/contest/thank-you',
      disclaimer:
        'By submitting this form, I confirm that I have read and understood the [Privacy Policy](https://supabase.com/privacy) and the [Official Rules](/go/contest-rules).',
      crm: {
        hubspot: {
          formGuid: '84f33ded-e17a-4745-b732-62d59bc08aa5',
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
          event: 'event_attended',
          profileMap: {
            email_address: 'email',
            first_name: 'first_name',
            last_name: 'last_name',
            company_name: 'company_name',
          },
          staticProperties: {
            event_name: 'PG Down Under 2026',
          },
        },
      },
    },
  ],
}

export default page
