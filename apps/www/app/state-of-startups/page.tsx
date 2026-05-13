import type { Metadata } from 'next'

import { preloadStatData, preloadSurveyData } from './lib/preload-survey-data'
import { RegisterContent } from './register/RegisterContent'
import StateOfStartups2026Content from './StateOfStartups2026Content'

// TODO (alan): set this to true once results are available.
const SHOW_RESULTS = true

// Re-aggregate survey RPCs on the server every hour. Keeps the chart payload
// inlined into the static HTML without forcing a full deploy whenever the
// upstream survey data changes.
export const revalidate = 3600

export const metadata: Metadata = SHOW_RESULTS
  ? {
      title: 'State of Startups 2026 | Supabase',
      description:
        'The latest trends among builders in tech stacks, AI usage, problem domains, and more.',
      alternates: {
        canonical: 'https://supabase.com/state-of-startups',
      },
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
      alternates: {
        canonical: 'https://supabase.com/state-of-startups',
      },
      openGraph: {
        title: 'State of Startups 2026 — Survey | Supabase',
        description: 'Be the first to access the State of Startups 2026 report.',
        url: 'https://supabase.com/state-of-startups',
      },
    }

export default async function StateOfStartupsPage() {
  if (!SHOW_RESULTS) return <RegisterContent />

  const [preloadedData, preloadedStats] = await Promise.all([
    preloadSurveyData(),
    preloadStatData(),
  ])
  return (
    <StateOfStartups2026Content preloadedData={preloadedData} preloadedStats={preloadedStats} />
  )
}
