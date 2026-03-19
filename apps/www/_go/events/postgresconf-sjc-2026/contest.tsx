import type { GoPageInput } from 'marketing'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from 'ui'

import authors from '@/lib/authors.json'

const speaker1 = authors.find((a) => a.author_id === 'deepthi_sigireddi')
const speaker2 = authors.find((a) => a.author_id === 'sugu_sougoumarane')

const page: GoPageInput = {
  template: 'lead-gen',
  slug: 'postgresconf-sjc-2026/contest',
  metadata: {
    title: 'Win a Mac Mini | Supabase at PostgresConf San Jose 2026',
    description:
      'Sign up for Supabase and enter the contest for a chance to win a Mac Mini. PostgresConf San Jose 2026.',
  },
  hero: {
    title: 'Win a Mac Mini',
    subtitle: 'Supabase at PostgresConf San Jose 2026',
    description:
      'Supabase is Postgres with batteries included -- auth, storage, edge functions, vectors, and real-time, all built on top of the database you already know. Sign up, load some data, and enter below for a chance to win a Mac Mini.',
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
      title: 'Multigres: One stop PostgreSQL Management and Scaling',
      description: 'Conference Talk: Thursday, April 23, 2026 2:30pm PDT',
      children: (
        <div className="flex flex-col items-center gap-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 max-w-2xl">
            {speaker1 && (
              <div className="flex flex-col items-center gap-4">
                {speaker1.author_image_url && (
                  <Image
                    src={speaker1.author_image_url}
                    alt={speaker1.author}
                    width={192}
                    height={192}
                    className="rounded-full object-cover aspect-square w-48 h-48"
                  />
                )}
                <div className="flex flex-col items-center gap-0">
                  <p className="text-foreground-light font-medium text-center">
                    {speaker1.author}
                    {speaker1.position && `, ${speaker1.position}`}
                  </p>
                  <p className="text-foreground-lighter text-sm text-center">Supabase</p>
                </div>
              </div>
            )}
            {speaker2 && (
              <div className="flex flex-col items-center gap-4">
                {speaker2.author_image_url && (
                  <Image
                    src={speaker2.author_image_url}
                    alt={speaker2.author}
                    width={192}
                    height={192}
                    className="rounded-full object-cover aspect-square w-48 h-48"
                  />
                )}
                <div className="flex flex-col items-center gap-0">
                  <p className="text-foreground-light font-medium text-center">
                    {speaker2.author}
                    {speaker2.position && `, ${speaker2.position}`}
                  </p>
                  <p className="text-foreground-lighter text-sm text-center">Supabase</p>
                </div>
              </div>
            )}
          </div>
          <Button asChild type="default" size="medium">
            <Link
              href="https://supabase.link/postgresconf-sjc-2026-slides"
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
      successRedirect: '/go/postgresconf-sjc-2026/contest/thank-you',
      disclaimer:
        'By submitting this form, I confirm that I have read and understood the [Privacy Policy](https://supabase.com/privacy) and the [Official Rules](/go/contest-rules).',
      crm: {
        hubspot: {
          formGuid: '1f508323-bd39-497d-b4bf-4978a50d9248',
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
            event_name: 'PostgresConf San Jose 2026',
          },
        },
      },
    },
  ],
}

export default page
