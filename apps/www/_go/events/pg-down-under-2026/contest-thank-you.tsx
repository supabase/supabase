import type { GoPageInput } from 'marketing'
import Link from 'next/link'
import { Button } from 'ui'

const page: GoPageInput = {
  template: 'thank-you',
  slug: 'pg-down-under-2026/contest/thank-you',
  metadata: {
    title: "You're entered | Supabase at PG Down Under 2026",
    description: 'Thanks for entering the Supabase raffle at PG Down Under 2026. Good luck!',
  },
  hero: {
    title: 'Thanks for entering',
    description:
      "Your raffle entry is confirmed. Make sure you've created a Supabase account and loaded data before the 2:45 PM AEDT deadline on October 30. The winner will be drawn onsite at 3:00 PM at the Supabase stand.",
  },
  sections: [
    {
      type: 'single-column',
      title: 'Get started with Supabase',
      description: "If you haven't already, create your account and start building.",
      children: (
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button asChild size="small">
            <a href="https://supabase.com/dashboard">Go to dashboard</a>
          </Button>
          <Button asChild variant="outline" size="small">
            <Link href="https://supabase.com">Visit supabase.com</Link>
          </Button>
        </div>
      ),
    },
  ],
}

export default page
