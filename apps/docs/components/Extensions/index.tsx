'use client'

import { Suspense, lazy } from 'react'

const ExtensionsInternal = lazy(() => import('./Extensions'))

export function Extensions() {
  return (
    <Suspense>
      <ExtensionsInternal />
    </Suspense>
  )
}
