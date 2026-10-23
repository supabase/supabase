import { useCallback, useEffect, useMemo, useState } from 'react'

import { useView } from '../Trace'
import type { TimeScale } from '../types'
import { computeTimeScale } from '../utils'

export interface UseTimeScaleOptions {
  targetTickSpacing?: number
}

export interface UseTimeScaleResult<T extends HTMLElement> {
  ref: (element: T | null) => void
  width: number
  scale: TimeScale
}

export function useTimeScale<T extends HTMLElement = HTMLDivElement>(
  options: UseTimeScaleOptions = {}
): UseTimeScaleResult<T> {
  const { targetTickSpacing = 80 } = options
  const { window, bounds } = useView()
  const [element, setElement] = useState<T | null>(null)
  const [width, setWidth] = useState(0)

  const ref = useCallback((node: T | null) => setElement(node), [])

  useEffect(() => {
    if (!element) return
    const measure = () => {
      const next = element.getBoundingClientRect().width
      setWidth((previous) => (Math.abs(previous - next) < 0.5 ? previous : next))
    }
    measure()
    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    return () => observer.disconnect()
  }, [element])

  const [start, end] = window
  const origin = bounds[0]
  const scale = useMemo(
    () => computeTimeScale({ window: [start, end], width, origin, targetTickSpacing }),
    [start, end, width, origin, targetTickSpacing]
  )

  return { ref, width, scale }
}
