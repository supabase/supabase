'use client'

import { usePathname } from 'next/navigation'
import { useEffect } from 'react'
import { DOCS_CONTENT_CONTAINER_ID } from './helpers.constants'

const useScrollTopOnPageChange = () => {
  const pathname = usePathname()

  useEffect(() => {
    if (document && pathname) {
      // Don't scroll on reference pages
      if (pathname.startsWith('/reference/')) return

      const container = document.getElementById(DOCS_CONTENT_CONTAINER_ID)
      if (container) container.scrollTop = 0
      /**
       * a11y works by default, so no need to specially handle it
       */
    }
  }, [pathname])
}

/**
 * Scroll the docs content container to top on page change. Can't use Next.js's
 * native scroll restoration, because we scroll the content container, not the
 * document.
 */
const ScrollRestoration = () => {
  useScrollTopOnPageChange()
  return null
}

export { ScrollRestoration }
