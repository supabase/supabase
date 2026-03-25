import type { GoPageInput } from 'marketing'
import Link from 'next/link'
import { Button } from 'ui'

const page: GoPageInput = {
  template: 'thank-you',
  slug: 'dash-2026/exec-dinner/thank-you',
  metadata: {
    title: "You're confirmed | Supabase Executive Dinner",
    description:
      'Your RSVP for the Supabase executive dinner at DASH 2026 has been confirmed. Venue and date to be announced.',
  },
  hero: {
    title: "You're confirmed",
    description:
      "We'll send details including venue, date, and directions closer to the event. We look forward to seeing you.",
  },
  sections: [
    {
      type: 'single-column',
      title: 'In the meantime',
      description: 'Learn more about what we are building at Supabase.',
      children: (
        <div className="flex items-center justify-center gap-4">
          <Button asChild type="default" size="small">
            <Link href="https://supabase.com">Visit supabase.com</Link>
          </Button>
        </div>
      ),
    },
  ],
}

export default page
