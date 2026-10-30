'use client'

import { useEffect, type EffectCallback } from 'react'

/**
 * runs an effect once on mount, with its cleanup on unmount, the escape hatch for one-time
 * sync with an external system and derive state or use event handlers everywhere else
 */
export function useMountEffect(effect: EffectCallback): void {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(effect, [])
}
