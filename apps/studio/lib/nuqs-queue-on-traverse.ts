import { resetQueues } from 'nuqs/reset-queues'
import { useEffect } from 'react'

// NOTE: the pages adapter skips its queue reset while its own router update is
// still resolving. a popstate in that window has to reset anyway, or the queued
// value keeps winning over the url. the update's own navigation is not a traverse.
export function shouldResetNuqsQueueOnNavigation({
  isNuqsUpdate,
  isTraverse,
}: {
  isNuqsUpdate: boolean
  isTraverse: boolean
}): boolean {
  if (isTraverse) {
    return true
  }

  return !isNuqsUpdate
}

export function installNuqsTraverseQueueReset(reset: () => void): () => void {
  if (typeof window === 'undefined') {
    return () => {}
  }

  const onPopState = () => {
    const shouldReset = shouldResetNuqsQueueOnNavigation({
      isNuqsUpdate: true,
      isTraverse: true,
    })

    if (!shouldReset) {
      return
    }

    reset()
  }

  window.addEventListener('popstate', onPopState, true)

  return () => {
    window.removeEventListener('popstate', onPopState, true)
  }
}

export const NuqsTraverseQueueReset = () => {
  useEffect(() => installNuqsTraverseQueueReset(resetQueues), [])

  return null
}
