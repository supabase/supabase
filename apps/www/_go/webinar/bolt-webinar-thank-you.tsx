import type { GoPageInput } from 'marketing'
import Link from 'next/link'
import { Button } from 'ui'

const page: GoPageInput = {
  template: 'thank-you',
  slug: 'vibe-coding-done-right-webinar/thank-you',
  metadata: {
    title: 'Thank you',
    description: 'Thanks for getting in touch. We’ll be in touch with resources and next steps.',
  },
  hero: {
    title: 'Thanks for getting in touch',
    description: "We've received your details. Our team will follow up with you shortly.",
  },
  sections: [
    {
      type: 'single-column',
      title: 'In the meantime',
      description: 'Explore Supabase and get ready to build with AI-assisted development.',
      children: (
        <div className="flex items-center justify-center gap-4">
          <Button asChild type="default" size="small">
            <Link href="https://supabase.com/docs">Read the docs</Link>
          </Button>
          <Button asChild type="text" size="small">
            <Link href="https://supabase.com/dashboard">Start a project</Link>
          </Button>
        </div>
      ),
    },
  ],
}

export default page
