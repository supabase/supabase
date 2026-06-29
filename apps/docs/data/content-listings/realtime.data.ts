import type { ContentListingGroup } from '~/lib/content-listings.schema'

export const realtimeGetStarted: ContentListingGroup = {
  id: 'realtime-get-started',
  heading: 'Get started',
  type: 'grid',
  columns: 2,
  items: [
    {
      title: 'Getting Started',
      href: '/guides/realtime/getting_started',
      description: 'Set up Realtime in your project and send your first message.',
    },
  ],
}

export const realtimeExamples: ContentListingGroup = {
  id: 'realtime-examples',
  heading: 'Examples',
  type: 'grid',
  columns: 2,
  items: [
    {
      title: 'Multiplayer.dev',
      href: 'https://multiplayer.dev',
      description:
        'Showcase application displaying cursor movements and chat messages using Broadcast.',
    },
    {
      title: 'Chat',
      href: 'https://supabase.com/ui/docs/nextjs/realtime-chat',
      description: 'Supabase UI chat component using Broadcast to send message between users.',
    },
    {
      title: 'Avatar Stack',
      href: 'https://supabase.com/ui/docs/nextjs/realtime-avatar-stack',
      description: 'Supabase UI avatar stack component using Presence to track connected users.',
    },
    {
      title: 'Realtime Cursor',
      href: 'https://supabase.com/ui/docs/nextjs/realtime-cursor',
      description:
        "Supabase UI realtime cursor component using Broadcast to share users' cursors to build collaborative applications.",
    },
  ],
}

export const realtimeResources: ContentListingGroup = {
  id: 'realtime-resources',
  heading: 'Resources',
  description: 'Find the source code and documentation in the Supabase GitHub repository:',
  type: 'grid',
  columns: 2,
  items: [
    {
      title: 'Supabase Realtime',
      href: 'https://github.com/supabase/realtime',
      description: 'View the source code.',
    },
    {
      title: 'Realtime: Multiplayer Edition',
      href: 'https://supabase.com/blog/supabase-realtime-multiplayer-general-availability',
      description: 'Read more about Supabase Realtime.',
    },
  ],
}
