import type { GoPageInput } from 'marketing'
import { Button } from 'ui'

const page: GoPageInput = {
  template: 'thank-you',
  slug: 'example-thank-you',
  metadata: {
    title: 'Thank You',
    description: 'Thanks for signing up.',
  },
  hero: {
    title: "You're all set!",
    description: 'Check your inbox for a confirmation email with your download link.',
  },
  sections: [
    {
      type: 'single-column',
      title: 'While you wait',
      description:
        'Explore our documentation and tutorials to get started with Supabase right away.',
      children: (
        <div className="flex items-center justify-center gap-4">
          <Button asChild size="small">
            <a href="https://supabase.com/docs">Read the docs</a>
          </Button>
          <Button asChild variant="text" size="small">
            <a href="https://supabase.com/docs/guides">Watch tutorials</a>
          </Button>
        </div>
      ),
    },
  ],
}

export default page
