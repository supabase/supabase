import { useEffect, useRef, useState } from 'react'

/**
 * Returns `value`, but keeps each value on screen for at least `minimumMs` so quick changes
 * don't flash past. Values that arrive while one is held are skipped in favor of the latest.
 *
 * @param isEqual should be a stable reference, e.g. an imported function
 */
export function useMinimumDisplayTime<T>(
  value: T,
  minimumMs: number,
  isEqual: (a: T, b: T) => boolean = Object.is
): T {
  const [displayed, setDisplayed] = useState(value)
  const shownAtRef = useRef(Date.now())

  useEffect(() => {
    if (isEqual(displayed, value)) return

    const show = () => {
      shownAtRef.current = Date.now()
      setDisplayed(value)
    }

    const remainingMs = minimumMs - (Date.now() - shownAtRef.current)
    if (remainingMs <= 0) {
      show()
      return
    }

    const timeout = setTimeout(show, remainingMs)
    return () => clearTimeout(timeout)
  }, [value, displayed, minimumMs, isEqual])

  return displayed
}
