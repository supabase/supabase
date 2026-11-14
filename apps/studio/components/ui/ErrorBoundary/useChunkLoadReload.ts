import { useEffect, useState } from 'react'

import { getChunkLoadReloadDecision, peekChunkLoadReload } from '@/lib/chunk-load-error'

/**
 * For error boundary fallbacks: reloads the page to recover from a failed
 * chunk load, and reports whether the fallback should render nothing while
 * that reload is in flight.
 *
 * Render only peeks at the reload guard; the reload is claimed after commit,
 * so a render React discards can't use up the guard without reloading. If
 * the claim is refused after all (the guard write didn't stick), the hook
 * flips to `isReloading: false` so the fallback shows its error state.
 */
export function useChunkLoadReload(error: unknown) {
  const canReload = peekChunkLoadReload(error)
  const [refusedError, setRefusedError] = useState<unknown>(undefined)

  useEffect(() => {
    if (!canReload) return
    if (getChunkLoadReloadDecision(error)) window.location.reload()
    else setRefusedError(error)
  }, [error, canReload])

  return { isReloading: canReload && refusedError !== error }
}
