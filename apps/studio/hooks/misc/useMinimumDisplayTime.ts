import { useEffect, useRef, useState } from 'react'

/**
 * Returns `value`, keeping each one for at least `minimumMs` so quick changes don't flash past.
 * Values that arrive in the meantime are skipped in favor of the latest.
 */
export function useMinimumDisplayTime<T>(value: T, minimumMs: number): T {
  const [displayed, setDisplayed] = useState(value)
  const shownAtRef = useRef(Date.now())

  useEffect(() => {
    if (Object.is(displayed, value)) return

    const remainingMs = minimumMs - (Date.now() - shownAtRef.current)
    const timeout = setTimeout(
      () => {
        shownAtRef.current = Date.now()
        setDisplayed(value)
      },
      Math.max(0, remainingMs)
    )
    return () => clearTimeout(timeout)
  }, [value, displayed, minimumMs])

  return displayed
}
