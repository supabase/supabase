import { lazy, Suspense } from 'react'

const Generator = lazy(() => import('./JwtGenerator'))

export function JwtGenerator() {
  return (
    <Suspense>
      <Generator />
    </Suspense>
  )
}
