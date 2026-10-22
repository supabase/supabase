'use client'

import { useFeatureFlags, useSearchParamsShallow } from 'common'
import { useEffect, useState } from 'react'

import { IA_NAV_FLAG, isIaNavVariant } from './constants'

const READY_TIMEOUT_MS = 1000

/**
 * True once the visitor's nav variant is known, so the nav can stay hidden instead of
 * flashing today's nav. Falls back to true after a timeout in case flags never load.
 */
export function useIaNavReady(): boolean {
  const { hasLoaded } = useFeatureFlags()
  const override = useSearchParamsShallow().get(IA_NAV_FLAG)
  const [hasTimedOut, setHasTimedOut] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setHasTimedOut(true), READY_TIMEOUT_MS)
    return () => clearTimeout(timer)
  }, [])

  return isIaNavVariant(override) || Boolean(hasLoaded) || hasTimedOut
}
