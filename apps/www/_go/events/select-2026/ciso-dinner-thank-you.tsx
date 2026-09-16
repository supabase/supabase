import type { GoPageInput } from 'marketing'
import Link from 'next/link'
import { Button } from 'ui'

const page: GoPageInput = {
  template: 'thank-you',
  slug: 'select-2026/ciso-dinner/thank-you',
  metadata: {
    title: "You're confirmed | Supabase CISO Dinner",
    description:
      'Your RSVP for the Supabase CISO dinner at Flour + Water in San Francisco on October 1, 2026 has been confirmed. Cocktails begin at 7:00 PM and dinner starts at 7:30 PM.',
  },
  hero: {
    title: "You're confirmed",
    description:
      "We'll see you at Flour + Water in San Francisco on October 1, 2026. Cocktails begin at 7:00 PM and dinner starts at 7:30 PM. We look forward to the conversation.",
  },
  sections: [
    {
      type: 'single-column',
      title: 'In the meantime',
      description: 'Learn more about how we think about security at Supabase.',
      children: (
        <div className="flex items-center justify-center gap-4">
          <Button asChild size="small">
            <Link href="https://supabase.com/security">Explore Supabase security</Link>
          </Button>
        </div>
      ),
    },
  ],
}

export default page
