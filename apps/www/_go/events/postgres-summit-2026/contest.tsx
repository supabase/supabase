import type { GoPageInput } from 'marketing'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from 'ui'

const page: GoPageInput = {
  template: 'lead-gen',
  slug: 'postgres-summit-2026/contest',
  metadata: {
    title: 'Win a MacBook Neo | Supabase at Postgres Summit US 2026',
    description:
      'Thanks for connecting with us at Postgres Summit US 2026. Try Supabase — Postgres with everything you need. Enter for a chance to win a MacBook Neo.',
  },
  hero: {
    title: 'Win a MacBook Neo',
    subtitle: 'Supabase at Postgres Summit US 2026',
    description:
      'Thanks for connecting with us at Postgres Summit US 2026. Try Supabase — Postgres with everything you need. Enter for a chance to win a MacBook Neo.',
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
      title: 'Everything to know about Postgres Locks',
      description: 'Conference Talk: Wednesday, September 30, 2026 4:00 PM EDT, Rossi Intermediate',
      children: (
        <div className="flex flex-col items-center gap-6">
          <Image
            src="/images/landing-pages/postgres-summit-NYC-2026/brian-brennglass.png"
            alt="Brian Brennglass"
            width={192}
            height={192}
            className="rounded-full object-cover aspect-square w-48 h-48"
          />
          <div className="flex flex-col items-center gap-0">
            <p className="text-foreground-light font-medium">Brian Brennglass</p>
            <p className="text-foreground-lighter text-sm">Supabase</p>
          </div>
          <Button asChild variant="default" size="medium">
            <Link
              href="https://postgresql.us/events/postgressummitus2026/schedule/session/2406-everything-to-know-about-postgres-locks/"
              target="_blank"
              rel="noopener noreferrer"
            >
              View session details
            </Link>
          </Button>
        </div>
      ),
    },
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
            <li>
              Complete these steps by the contest deadline, Monday October 12, 2026 at 12:00 PM PDT
            </li>
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
      successRedirect: '/go/postgres-summit-2026/contest/thank-you',
      disclaimer:
        'By submitting this form, I confirm that I have read and understood the [Privacy Policy](https://supabase.com/privacy) and the [Official Rules](/go/contest-rules).',
      crm: {
        hubspot: {
          formGuid: '32a0223e-784e-43bb-bdba-5cb3e72f35bd',
          fieldMap: {
            first_name: 'firstname',
            last_name: 'lastname',
            email_address: 'email',
            company_name: 'name',
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
            event_name: 'Postgres Summit US 2026',
          },
        },
      },
    },
  ],
}

export default page
