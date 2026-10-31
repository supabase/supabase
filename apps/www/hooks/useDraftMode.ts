'use client'

import { useEffect, useState } from 'react'

/**
 * Hook to detect if the user is in Next.js Draft Mode
 * Checks for the __prerender_bypass cookie that Next.js sets when draft mode is enabled
 */
export function useDraftMode() {
  const [isDraftMode, setIsDraftMode] = useState(false)

  useEffect(() => {
    // Check if we're in the browser and if the draft mode cookie exists
    if (typeof window !== 'undefined') {
      const hasDraftCookie = document.cookie.includes('__prerender_bypass')
      setIsDraftMode(hasDraftCookie)
    }
  }, [])

  return isDraftMode
}
