import type { Metadata } from 'next'
import { Suspense } from 'react'

import { LibraryOverview } from '@/components/library-overview'
import { canonicalAlternates } from '@/lib/canonical'

export const metadata: Metadata = {
  alternates: canonicalAlternates(''),
}

export default function Home() {
  return (
    <Suspense>
      <LibraryOverview />
    </Suspense>
  )
}
