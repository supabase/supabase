import type { Metadata } from 'next'
import StateOfStartups2026Content from './StateOfStartups2026Content'

export const metadata: Metadata = {
  title: 'State of Startups 2026 | Supabase',
  description:
    'The latest trends among builders in tech stacks, AI usage, problem domains, and more.',
  openGraph: {
    title: 'State of Startups 2026 | Supabase',
    description:
      'The latest trends among builders in tech stacks, AI usage, problem domains, and more.',
    url: 'https://supabase.com/state-of-startups',
    images: [
      {
        url: 'https://supabase.com/images/state-of-startups/2026/state-of-startups-og.png',
      },
    ],
  },
}

export default function StateOfStartupsPage() {
  return <StateOfStartups2026Content />
}
