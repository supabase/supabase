import type { GoPageInput } from 'marketing'
import Link from 'next/link'
import { Button } from 'ui'

const page: GoPageInput = {
  template: 'thank-you',
  slug: 'nyc-2026/exec-dinner/thank-you',
  metadata: {
    title: "You're confirmed | Supabase Executive Dinner",
    description:
      'Your RSVP for the Supabase executive dinner has been confirmed. Join us at Manhatta Restaurant with cocktails at 6:30 PM and dinner at 7:00 PM.',
  },
  hero: {
    title: "You're confirmed",
    description:
      "We'll see you at Manhatta Restaurant. Cocktails begin at 6:30 PM and dinner starts at 7:00 PM. We look forward to seeing you.",
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
