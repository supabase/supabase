'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

/**
 * Reference docs use `history.pushState()` to jump to
 * sub-sections without causing a re-render.
 *
 * We need to the below handler to manually force a re-render
 * when navigating away from, then back to reference docs
 */
const RefDocHistoryHandler = () => {
  const router = useRouter()

  useEffect(() => {
    const handler = () => {
      router.replace(window.location.href)
    }

    window.addEventListener('popstate', handler)

    return () => {
      window.removeEventListener('popstate', handler)
    }
  }, [router])

  return null
}

export { RefDocHistoryHandler }
