import type { GoPageInput } from 'marketing'
import Link from 'next/link'
import { Button } from 'ui'

const page: GoPageInput = {
  template: 'thank-you',
  slug: 'mcp/contest-thank-you',
  metadata: {
    title: "You're entered | Supabase at MCP Dev Summit 2026",
    description: 'Thanks for entering the Supabase contest at MCP Dev Summit 2026. Good luck!',
  },
  hero: {
    title: 'Thanks for entering',
    description:
      "Your contest entry is confirmed. Make sure you've created a Supabase account and loaded data before the contest deadline. We'll reach out to the winner by email.",
  },
  sections: [
    {
      type: 'single-column',
      title: 'Get started with Supabase',
      description: "If you haven't already, create your account and start building.",
      children: (
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button asChild type="default" size="small">
            <Link href="https://supabase.com/dashboard">Go to dashboard</Link>
          </Button>
          <Button asChild type="outline" size="small">
            <Link href="https://supabase.com">Visit supabase.com</Link>
          </Button>
        </div>
      ),
    },
  ],
}

export default page
