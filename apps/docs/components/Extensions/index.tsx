import { lazy, Suspense } from 'react'

const ExtensionsInternal = lazy(() => import('./Extensions'))

export function Extensions() {
  return (
    <Suspense>
      <ExtensionsInternal />
    </Suspense>
  )
}
