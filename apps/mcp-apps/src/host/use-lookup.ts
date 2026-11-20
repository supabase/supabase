import { useEffect, useRef, useState } from 'react'

/**
 * A best-effort value the view can do without, such as a name for the card's
 * breadcrumbs: undefined until `load` resolves, and for good if it fails.
 * Loads again when `key` changes; an undefined `key` skips it.
 */
export function useLookup<T>(key: string | undefined, load: () => Promise<T>): T | undefined {
  const [value, setValue] = useState<T>()

  const latestLoad = useRef(load)
  useEffect(() => {
    latestLoad.current = load
  })

  useEffect(() => {
    if (key === undefined) return
    let isCurrent = true
    latestLoad.current().then(
      (loaded) => isCurrent && setValue(loaded),
      () => {}
    )
    return () => {
      isCurrent = false
    }
  }, [key])

  return value
}
