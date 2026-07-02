import type { GoPageInput } from 'marketing'
import Link from 'next/link'
import { Button } from 'ui'

const page: GoPageInput = {
  template: 'thank-you',
  slug: 'select-2026/partner-day/thank-you',
  metadata: {
    title: "You're confirmed | Supabase Partner Day",
    description:
      'Your RSVP for Supabase Partner Day in San Francisco on October 1, 2026 has been confirmed. We look forward to seeing you.',
  },
  hero: {
    title: "You're confirmed",
    description:
      "We'll see you at Supabase Partner Day in San Francisco on October 1, 2026. We're looking forward to it.",
  },
  sections: [
    {
      type: 'single-column',
      title: 'In the meantime',
      description: 'Learn more about what we are building at Supabase.',
      children: (
        <div className="flex items-center justify-center gap-4">
          <Button asChild variant="default" size="small">
            <Link href="https://supabase.com">Visit supabase.com</Link>
          </Button>
        </div>
      ),
    },
  ],
}

export default page
