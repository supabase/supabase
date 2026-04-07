import type { Metadata } from 'next'

import { RegisterContent } from './register/RegisterContent'
import StateOfStartups2026Content from './StateOfStartups2026Content'

// TODO (alan): set this to true once results are available.
const SHOW_RESULTS = false

export const metadata: Metadata = SHOW_RESULTS
  ? {
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
  : {
      title: 'State of Startups 2026 — Survey | Supabase',
      description: 'Be the first to access the State of Startups 2026 report.',
    }

export default function StateOfStartupsPage() {
  return SHOW_RESULTS ? <StateOfStartups2026Content /> : <RegisterContent />
}
