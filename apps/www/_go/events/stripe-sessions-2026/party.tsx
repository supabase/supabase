import type { GoPageInput } from 'marketing'
import Link from 'next/link'
import { Button } from 'ui'

const page: GoPageInput = {
  template: 'lead-gen',
  slug: 'sf-rooftop-party',
  metadata: {
    title: 'Win a MacBook Neo | Supabase, Stigg & Dreambase Rooftop Party',
    description:
      'Thanks for coming to the Supabase, Stigg, and Dreambase Rooftop Party. Complete the steps for a chance to win a MacBook Neo.',
  },
  hero: {
    title: 'Thanks for partying with us',
    subtitle: 'Supabase, Stigg & Dreambase Rooftop Party',
    description:
      'Thanks for joining us at the rooftop party! Try out Supabase, Stigg, and Dreambase for a chance to win a MacBook Neo.',
    image: {
      src: '/images/landing-pages/sxsw-2026/macbook-neo.png',
      alt: 'MacBook Neo in four colors',
    },
    ctas: [
      {
        label: 'Enter now',
        href: '#how-to-enter',
        variant: 'primary',
      },
    ],
  },
  sections: [
    {
      type: 'three-column',
      id: 'hosts',
      title: "Tonight's hosts",
      children: (
        <>
          <Link
            href="https://supabase.com/dashboard"
            className="flex flex-col items-center gap-4 rounded-xl border border-muted p-8 text-center transition-colors hover:border-foreground-muted hover:bg-surface-100"
          >
            <img src="/images/supabase-logo-icon.svg" alt="Supabase" className="h-10 w-auto" />
            <h3 className="text-foreground font-medium text-lg">Supabase</h3>
            <p className="text-foreground-light text-sm leading-relaxed">
              Open-source Postgres development platform
            </p>
          </Link>
          <Link
            href="https://stigg.io"
            className="flex flex-col items-center gap-4 rounded-xl border border-muted p-8 text-center transition-colors hover:border-foreground-muted hover:bg-surface-100"
          >
            <img src="/images/customers/logos/stigg.svg" alt="Stigg" className="h-10 w-auto" />
            <h3 className="text-foreground font-medium text-lg">Stigg</h3>
            <p className="text-foreground-light text-sm leading-relaxed">
              Monetization layer for AI products
            </p>
          </Link>
          <Link
            href="https://dreambase.ai"
            className="flex flex-col items-center gap-4 rounded-xl border border-muted p-8 text-center transition-colors hover:border-foreground-muted hover:bg-surface-100"
          >
            <img
              src="/images/customers/logos/dreambase-mark.png"
              alt="Dreambase"
              className="h-10 w-auto"
            />
            <h3 className="text-foreground font-medium text-lg">Dreambase</h3>
            <p className="text-foreground-light text-sm leading-relaxed">
              AI-native analytics and dashboards for Supabase
            </p>
          </Link>
        </>
      ),
    },
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
          <Button asChild type="primary" size="medium">
            <Link href="https://supabase.com/dashboard">Start with Supabase</Link>
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
