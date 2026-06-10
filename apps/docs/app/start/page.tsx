import { BASE_PATH } from '~/lib/constants'
import { type Metadata } from 'next'
import { getStartFeatures, StartClient } from 'start'

export const metadata: Metadata = {
  title: 'Get started | Supabase Docs',
  description:
    'Tell us what you’re building and get a tailored Supabase setup guide and a copyable agent plan.',
  alternates: {
    canonical: `${BASE_PATH}/start`,
  },
}

export default function StartPage() {
  // Derived from the embedded `templates` package — the same data the www
  // composer consumes. Resolving it here keeps StartClient fully data-driven.
  const features = getStartFeatures()

  return <StartClient features={features} />
}
