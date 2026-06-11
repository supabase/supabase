import { BASE_PATH } from '~/lib/constants'
import { type Metadata } from 'next'
import { Suspense } from 'react'
import { getStartTemplates } from 'start'

import { StartPageClient } from './StartPageClient'

export const metadata: Metadata = {
  title: 'Get started | Supabase Docs',
  description:
    'Tell us what you’re building and get a tailored Supabase setup guide and a copyable agent plan.',
  alternates: {
    canonical: `${BASE_PATH}/start`,
  },
}

export default function StartPage() {
  const templates = getStartTemplates()

  return (
    <div className="h-[calc(100dvh-var(--header-height))] min-h-0 overflow-hidden">
      <Suspense>
        <StartPageClient templates={templates} />
      </Suspense>
    </div>
  )
}
