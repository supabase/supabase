// Reference: https://usehooks.com/useLocalStorage/
import { safeLocalStorage } from 'common'
import { useCallback, useState } from 'react'

export function useLocalStorage<T>(key: string, initialValue: T) {
  // State to store our value
  // Pass initial state function to useState so logic is only executed once
  const [storedValue, setStoredValue] = useState<T>(() => {
    // safeLocalStorage handles SSR and unavailable storage (returns null);
    // the try/catch here only guards JSON.parse against corrupt values.
    const item = safeLocalStorage.getItem(key)
    try {
      return item ? (JSON.parse(item) as T) : initialValue
    } catch (error) {
      console.warn(`Failed to parse localStorage value for "${key}"`, error)
      return initialValue
    }
  })

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
