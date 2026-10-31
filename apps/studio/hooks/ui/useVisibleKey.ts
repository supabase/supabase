import { useState } from 'react'

/**
 * Returns a key that increments each time `isVisible` transitions from false to true.
 * Use this as the `key` prop on a component to force a clean remount on each open,
 * instead of a `useEffect` that imperatively resets internal state.
 */
export function useVisibleKey(isVisible: boolean): number {
  const [key, setKey] = useState(0)
  const [prevIsVisible, setPrevIsVisible] = useState(false)

  if (isVisible && !prevIsVisible) {
    setPrevIsVisible(true)
    setKey((k) => k + 1)
  } else if (!isVisible && prevIsVisible) {
    setPrevIsVisible(false)
  }

  return key
}
