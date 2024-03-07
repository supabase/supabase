import { lazy, Suspense } from 'react'

const Estimator = lazy(() => import('./RealtimeLimitsEstimator'))

export function RealtimeLimitsEstimator() {
  return (
    <Suspense>
      <Estimator />
    </Suspense>
  )
}
