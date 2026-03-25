import type { GoPageInput } from 'marketing'
import Link from 'next/link'
import { Button } from 'ui'

const page: GoPageInput = {
  template: 'lead-gen',
  slug: 'sxsw-2026/contest',
  metadata: {
    title: 'Win a MacBook Neo | Supabase x Dreambase at SXSW 2026',
    description: 'Sign up for Supabase and Dreambase for a chance to win a MacBook Neo. SXSW 2026.',
  },
  hero: {
    title: 'Win a MacBook Neo',
    subtitle: 'Supabase x Dreambase at SXSW 2026',
    description:
      'Thanks for stopping by the Supabase x Dreambase party at SXSW. Supabase and Dreambase have partnered to run a sweepstakes -- sign up for both Supabase and Dreambase, load some data, and you could walk away with a new MacBook Neo.',
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
            <li>
              Create a Supabase account with the same email address where you got our post-event
              note
            </li>
            <li>Create a Dreambase account using the same email address</li>
            <li>Load data into a Supabase database</li>
            <li>Complete these steps by Monday, March 30, 2026 at 12:00 PM PST</li>
          </ol>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <Button asChild type="default" size="medium">
              <Link href="https://supabase.com/dashboard">Create your Supabase account</Link>
            </Button>
            <Button asChild type="outline" size="medium">
              <Link href="https://dreambase.ai">Sign up for Dreambase</Link>
            </Button>
          </div>
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
