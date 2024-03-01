'use client'

import { useRouter } from 'next/compat/router'
import { useEffect } from 'react'

import { DOCS_CONTENT_CONTAINER_ID } from './uiConstants'

const useScrollTopOnPageChange = () => {
  const router = useRouter()

  useEffect(() => {
    const handleRouteChange = (url: string) => {
      if (document) {
        // Don't scroll on reference pages
        if (url.includes('reference/')) return

        const container = document.getElementById(DOCS_CONTENT_CONTAINER_ID)
        if (container) container.scrollTop = 0
        // TODO: Check and handle focus management for a11y
      }
    }

    if (router) router.events.on('routeChangeComplete', handleRouteChange)
    return () => {
      if (router) router.events.off('routeChangeComplete', handleRouteChange)
    }
  }, [router])
}

/**
 * Type guard that checks if a performance entry is a `PerformanceNavigationTiming`.
 */
const isPerformanceNavigationTiming = (
  entry: PerformanceEntry
): entry is PerformanceNavigationTiming => {
  return entry.entryType === 'navigation'
}

/**
 * Save/restore scroll position when reloading or navigating back/forward.
 *
 * Required since scroll happens within a sub-container, not the page root.
 */
const useRestoreScroll = () => {
  const router = useRouter()

  useEffect(() => {
    const STORAGE_KEY = 'scroll-position'

    const container = document.getElementById(DOCS_CONTENT_CONTAINER_ID)
    if (!container) {
      return
    }

    const previousScroll = Number(sessionStorage.getItem(STORAGE_KEY))
    const [entry] = window.performance.getEntriesByType('navigation')

    // Only restore scroll position on reload and back/forward events
    if (
      previousScroll &&
      entry &&
      isPerformanceNavigationTiming(entry) &&
      ['reload', 'back_forward'].includes(entry.type)
    ) {
      container.scrollTop = previousScroll
    }

    const handler = () => {
      // Scroll stored in session storage, so only persisted per tab
      sessionStorage.setItem(STORAGE_KEY, container.scrollTop.toString())
    }

    window.addEventListener('beforeunload', handler)

    return () => window.removeEventListener('beforeunload', handler)
  }, [router])
}

const ScrollRestoration = () => {
  useScrollTopOnPageChange()
  useRestoreScroll()

  return null
}

export { ScrollRestoration }
