import { Suspense } from 'react'

import { LibraryOverview } from '@/components/library-overview'

export default function Home() {
  return (
    <Suspense>
      <LibraryOverview />
    </Suspense>
  )
}
