import type { GoPageInput } from 'marketing'
import Link from 'next/link'
import { Button } from 'ui'

const page: GoPageInput = {
  template: 'lead-gen',
  slug: 'startup-grind-2026/contest',
  metadata: {
    title: 'Win an iPhone 17 Pro Max | Supabase at Startup Grind 2026',
    description:
      'Create a Supabase account and load data for a chance to win an iPhone 17 Pro Max. Startup Grind 2026.',
  },
  hero: {
    title: 'Win an iPhone 17 Pro Max',
    subtitle: 'Supabase at Startup Grind 2026',
    description:
      'Great meeting you at Startup Grind. Supabase gives you Postgres with auth, storage, edge functions, and real-time -- everything you need to ship your product faster. Try it out and you could win an iPhone 17 Pro Max.',
    image: {
      src: '/images/landing-pages/stripe-sessions/iphone17-pro-max.png',
      alt: 'Orange iPhone 17 Pro Max',
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
            <li>
              Create a Supabase account with the same email address where you got our post-event
              note
            </li>
            <li>Load data into a Supabase database</li>
            <li>Complete these steps by Monday, May 11, 2026 at 12:00 PM PST</li>
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
  ],
}

export default page
