'use client'

import { usePathname } from 'next/navigation'
import { useEffect } from 'react'
import { DOCS_CONTENT_CONTAINER_ID } from './uiConstants'

const useScrollTopOnPageChange = () => {
  const pathname = usePathname()

  useEffect(() => {
    if (document && pathname) {
      // Don't scroll on reference pages
      if (pathname.includes('reference/')) return
      console.log('一二三')

      const container = document.getElementById(DOCS_CONTENT_CONTAINER_ID)
      if (container) container.scrollTop = 0
      // TODO: Check and handle focus management for a11y
    }
  }, [pathname])
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
  const pathname = usePathname()

  useEffect(() => {
    const STORAGE_KEY = 'scroll-position'

    const container = document.getElementById(DOCS_CONTENT_CONTAINER_ID)
    if (!container) {
      return
    }

    if (pathname !== '/') {
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
    }

    const handler = () => {
      // Scroll stored in session storage, so only persisted per tab
      sessionStorage.setItem(STORAGE_KEY, container.scrollTop.toString())
    }

    window.addEventListener('beforeunload', handler)

    return () => window.removeEventListener('beforeunload', handler)
  }, [pathname])
}

const ScrollRestoration = () => {
  useScrollTopOnPageChange()
  useRestoreScroll()

  return null
}

export { ScrollRestoration }
