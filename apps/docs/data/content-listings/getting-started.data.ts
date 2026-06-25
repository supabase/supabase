import type { ContentListingGroup } from '~/lib/content-listings.schema'

export const gettingStartedGetStarted: ContentListingGroup = {
  id: 'getting-started-overview',
  type: 'grid',
  items: [
    {
      title: 'Build with AI tools',
      href: '/guides/ai-tools',
      description: 'Develop with Supabase AI-first using plugins, MCP, and skills.',
    },
    {
      title: 'API Keys',
      href: '/guides/getting-started/api-keys',
      description: 'Learn about the different API keys in Supabase and how to use them.',
    },
    {
      title: 'Local Development',
      href: '/guides/local-development',
      description: 'Use the Supabase CLI to develop locally and collaborate between teams.',
    },
  ],
}
