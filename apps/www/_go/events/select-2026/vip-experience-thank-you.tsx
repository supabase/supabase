import type { GoPageInput } from 'marketing'
import Link from 'next/link'
import { Button } from 'ui'

const page: GoPageInput = {
  template: 'thank-you',
  slug: 'select-2026/vip-experience/thank-you',
  metadata: {
    title: "You're confirmed | Supabase VIP Experience",
    description:
      'Your RSVP for the Supabase VIP dinner at Penny Roma in San Francisco on October 1, 2026 has been confirmed. Cocktails begin at 7:00 PM and dinner starts at 7:30 PM.',
  },
  hero: {
    title: "You're confirmed",
    description:
      "We'll see you at Penny Roma in San Francisco on October 1, 2026. Cocktails begin at 7:00 PM and dinner starts at 7:30 PM. We look forward to seeing you.",
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
