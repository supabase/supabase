'use client'

import { useRouter } from 'next/compat/router'
import { useEffect } from 'react'

import useDarkLaunchWeeks from '../hooks/useDarkLaunchWeeks'

export function useForceDeepDark() {
  const router = useRouter()
  const forceDarkMode = useDarkLaunchWeeks()

  // next-themes already sets `data-theme`/`color-scheme` correctly and
  // synchronously for the resolved theme. This hook only needs to step in
  // to force dark mode during launch weeks, regardless of the user's theme.
  useEffect(() => {
    if (!forceDarkMode) return

    const handleDocumentLoad = () => {
      document.documentElement.setAttribute('data-theme', 'dark')
      document.documentElement.style.colorScheme = 'dark'

      // Clean up the event listener
      window.removeEventListener('load', handleDocumentLoad)
    }

    // Check if document is already loaded
    if (document.readyState === 'complete') {
      handleDocumentLoad()
    } else {
      // Add a global load event listener
      window.addEventListener('load', handleDocumentLoad)
    }

    // Clean up the event listener on component unmount
    return () => {
      window.removeEventListener('load', handleDocumentLoad)
    }
  }, [forceDarkMode, router])
}
