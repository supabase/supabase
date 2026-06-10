import { BASE_PATH } from '~/lib/constants'
import { type Metadata } from 'next'
import { getStartTemplates, StartClient } from 'start'

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
      <StartClient templates={templates} />
    </div>
  )
}
