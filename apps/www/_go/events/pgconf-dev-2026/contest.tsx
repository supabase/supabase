import type { GoPageInput } from 'marketing'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from 'ui'

import authors from '@/lib/authors.json'

const speaker = authors.find((a) => a.author_id === 'manan_gupta')

const page: GoPageInput = {
  template: 'lead-gen',
  slug: 'pgconf-dev-2026/contest',
  metadata: {
    title: 'Win a Mac Mini | Supabase at PGConf.dev 2026',
    description:
      'Thanks for connecting with us at PGConf.dev 2026. Try Supabase — Postgres with everything you need. Enter for a chance to win a Mac Mini.',
  },
  hero: {
    title: 'Win a Mac Mini',
    subtitle: 'Supabase at PGConf.dev 2026',
    description:
      'Thanks for connecting with us at PGConf.dev 2026. Try Supabase — Postgres with everything you need. Enter for a chance to win a Mac Mini.',
    image: {
      src: '/images/landing-pages/postgresconf-sjc-2026/mac-mini.png',
      alt: 'Apple Mac Mini',
      width: 400,
      height: 400,
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
      title: 'Connection Pooling Beyond PgBouncer: A Custom Approach for Distributed PostgreSQL',
      description: 'Conference Talk: Wednesday, May 20, 2026 9:00am PDT',
      children: (
        <div className="flex flex-col items-center gap-6">
          {speaker?.author_image_url && (
            <Image
              src={speaker.author_image_url}
              alt={speaker.author}
              width={192}
              height={192}
              className="rounded-full object-cover aspect-square w-48 h-48"
            />
          )}
          <div className="flex flex-col items-center gap-0">
            <p className="text-foreground-light font-medium">
              {speaker?.author}
              {speaker?.position && `, ${speaker.position}`}
            </p>
            <p className="text-foreground-lighter text-sm">Supabase</p>
          </div>
          <Button asChild type="default" size="medium">
            <Link
              href="https://supabase.link/pgconf-dev-2026-slides"
              target="_blank"
              rel="noopener noreferrer"
            >
              Download Slides
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
            <li>Complete these steps by the contest deadline</li>
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
      successRedirect: '/go/pgconf-dev-2026/contest/thank-you',
      disclaimer:
        'By submitting this form, I confirm that I have read and understood the [Privacy Policy](https://supabase.com/privacy) and the [Official Rules](/go/contest-rules).',
      crm: {
        hubspot: {
          formGuid: 'de088855-9684-4194-97d7-82fe68537519',
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
            event_name: 'PGConf.dev 2026',
          },
        },
      },
    },
  ],
}

export default page
