import type { GoPageInput } from 'marketing'
import Link from 'next/link'
import { Button } from 'ui'

const page: GoPageInput = {
  template: 'lead-gen',
  slug: 'stripe/party',
  metadata: {
    title: 'Win a MacBook Neo | Supabase, Stigg & Dreambase at Stripe Sessions',
    description:
      'Join the Supabase, Stigg, and Dreambase party at Stripe Sessions 2026. Complete the steps for a chance to win a MacBook Neo.',
  },
  hero: {
    title: 'Thanks for partying with us',
    subtitle: 'Supabase, Stigg & Dreambase at Stripe Sessions 2026',
    description:
      "Great hanging out with you at Stripe Sessions. We're giving away a MacBook Neo to one lucky attendee. Complete the steps below to enter.",
    image: {
      src: '/images/landing-pages/sxsw-2026/macbook-neo.png',
      alt: 'MacBook Neo in four colors',
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
            <li>
              Create a Supabase account with the same email address where you got our post-event
              note
            </li>
            <li>Load data into a Supabase database</li>
            <li>
              Create a{' '}
              <Link href="https://stigg.io" className="underline">
                Stigg
              </Link>{' '}
              account using the same email
            </li>
            <li>
              Create a{' '}
              <Link href="https://dreambase.ai" className="underline">
                Dreambase
              </Link>{' '}
              account using the same email
            </li>
            <li>Complete these steps by Monday, May 11, 2026 at 12:00 PM PST</li>
          </ol>
          <Button asChild type="default" size="medium">
            <Link href="https://supabase.com/dashboard">Create your Supabase account</Link>
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
  ],
}

export default page
