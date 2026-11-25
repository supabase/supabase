import { ClientOnly } from '@tanstack/react-router'
import { lazy, Suspense } from 'react'
import { useCommandMenuInitiated } from 'ui-patterns/CommandMenu'

const LazyCommandMenu = lazy(() =>
  import('./CommandMenu').then((mod) => ({ default: mod.StudioCommandMenu }))
)

export const StudioCommandMenu = () => {
  const isInitiated = useCommandMenuInitiated()
  if (!isInitiated) return null

  return (
    <ClientOnly>
      <Suspense fallback={null}>
        <LazyCommandMenu />
      </Suspense>
    </ClientOnly>
  )
}
