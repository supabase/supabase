import type { GoPageInput } from 'marketing'
import Link from 'next/link'

const page: GoPageInput = {
  template: 'lead-gen',
  slug: 'stripe/contest',
  metadata: {
    title: 'Win an iPhone 17 Pro Max | Supabase at Stripe Sessions',
    description: 'Enter for a 1-in-10 chance to win an iPhone 17 Pro Max at Stripe Sessions 2026.',
  },
  hero: {
    title: 'Win an iPhone 17 Pro Max',
    subtitle: 'Supabase at Stripe Sessions 2026',
    description:
      "Great meeting you at Stripe Sessions. Try Supabase if you haven't already -- it's Postgres with all the tools you need to build AI-native applications. We're running a sweepstakes and you have a 1-in-10 chance of winning. Those are better odds than anywhere else!",
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
        <div className="flex flex-col gap-8 w-full max-w-2xl mx-auto">
          <p className="text-foreground-light text-lg text-center">
            Choose either path. Both qualify.
          </p>

          <div className="flex flex-col gap-3">
            <h3 className="text-foreground font-semibold text-lg">Option 1: Via Stripe Projects</h3>
            <p className="text-foreground-light">
              Provision a full Supabase backend from your terminal without opening a dashboard.
            </p>
            <pre className="bg-surface-200 rounded-md p-4 text-sm text-foreground-light overflow-x-auto">
              <code>{`stripe plugin install projects
stripe projects init my-app
stripe projects add supabase/project
stripe projects env --sync`}</code>
            </pre>
            <p className="text-foreground-lighter text-sm">
              Already have a Supabase account? The flow will prompt you to link it.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <h3 className="text-foreground font-semibold text-lg">
              Option 2: Via the Stripe Sync Engine
            </h3>
            <p className="text-foreground-light">
              Connect your Stripe account to Supabase and sync your payments, customers, and
              subscriptions into a live Postgres schema.
            </p>
            <Link
              href="https://supabase.com/dashboard/project/_/integrations"
              className="text-foreground underline"
            >
              Install the Stripe Sync Engine →
            </Link>
          </div>

          <p className="text-foreground-light text-sm">
            Both options must be completed by Monday, May 11, 2026 at 12:00 PM PST.
          </p>

          <p className="text-xs text-foreground-lighter mt-4 text-center">
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
