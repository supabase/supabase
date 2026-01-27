'use client'

import { Suspense, lazy } from 'react'

const Estimator = lazy(() => import('./RealtimeLimitsEstimator'))

export function RealtimeLimitsEstimator() {
  return (
    <Suspense>
      <Estimator />
    </Suspense>
  )
}
