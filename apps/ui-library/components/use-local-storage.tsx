// Reference: https://usehooks.com/useLocalStorage/
import { safeLocalStorage } from 'common'
import { useCallback, useLayoutEffect, useState } from 'react'

export function useLocalStorage<T>(key: string, initialValue: T) {
  // State to store our value
  const [storedValue, setStoredValue] = useState<T>(initialValue)

  // Read after mount so the server render and the hydrating client render agree.
  useLayoutEffect(() => {
    const item = safeLocalStorage.getItem(key)
    if (!item) return
    try {
      setStoredValue(JSON.parse(item) as T)
    } catch (error) {
      console.warn(`Failed to parse localStorage value for "${key}"`, error)
    }
  }, [key])

  // Return a wrapped version of useState's setter function that ...
  // ... persists the new value to localStorage.
  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      // Allow value to be a function so we have same API as useState
      const valueToStore = value instanceof Function ? value(storedValue) : value
      // Save state
      setStoredValue(valueToStore)
      // Persist (safeLocalStorage swallows storage errors internally)
      safeLocalStorage.setItem(key, JSON.stringify(valueToStore))
    },
    [key, storedValue]
  )

  return [storedValue, setValue] as const
}
