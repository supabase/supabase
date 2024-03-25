import { lazy, Suspense } from 'react'

const Generator = lazy(() => import('./AppleSecretGenerator'))

export function AppleSecretGenerator() {
  return (
    <Suspense>
      <Generator />
    </Suspense>
  )
}
