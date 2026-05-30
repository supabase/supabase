// Reference: https://usehooks.com/useLocalStorage/

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Dispatch, SetStateAction, useCallback, useMemo, useState } from 'react'

export function useLocalStorage<T>(key: string, initialValue: T) {
  // State to store our value
  // Pass initial state function to useState so logic is only executed once
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue
    }

    try {
      // Get from local storage by key
      const item = window.localStorage.getItem(key)
      // Parse stored json or if none return initialValue
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      // If error also return initialValue
      console.log(error)
      return initialValue
    }
  })

  // Return a wrapped version of useState's setter function that ...
  // ... persists the new value to localStorage.
  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      try {
        // Allow value to be a function so we have same API as useState
        const valueToStore = value instanceof Function ? value(storedValue) : value
        // Save state
        setStoredValue(valueToStore)
        // Save to local storage
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(key, JSON.stringify(valueToStore))
        }
      } catch (error) {
        // A more advanced implementation would handle the error case
        console.log(error)
      }
    },
    [key, storedValue]
  )

  return [storedValue, setValue] as const
}

/**
 * Hook to load/store values from local storage with an API similar
 * to `useState()`.
 *
 * Differs from `useLocalStorage()` in that it uses `react-query` to
 * invalidate stale values across hooks with the same key.
 */
export function useLocalStorageQuery<T>(key: string, initialValue: T) {
  const queryClient = useQueryClient()
  const queryKey = useMemo(() => ['localStorage', key], [key])

  const {
    error,
    data: storedValue = initialValue,
    isSuccess,
    isLoading,
    isError,
  } = useQuery({
    queryKey,
    queryFn: () => {
      if (typeof window === 'undefined') {
        return initialValue
      }

      const item = window.localStorage.getItem(key)

      if (!item) {
        return initialValue
      }

      return JSON.parse(item) as T
    },
  })

  const setValue: Dispatch<SetStateAction<T>> = useCallback(
    (value) => {
      const currentValue = queryClient.getQueryData<T>(queryKey) ?? initialValue
      const valueToStore = value instanceof Function ? value(currentValue) : value

      // Bail out when the value is unchanged (matches useState semantics).
      // Without this, no-op updates from consumers — like a pruning effect
      // whose updater returns `current` unchanged — still write to
      // localStorage and invalidate the query, which churns subscribers and
      // can cascade into "Maximum update depth exceeded" when two consumers
      // of the same key are mounted together.
      if (Object.is(valueToStore, currentValue)) return

      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore))
      }

      queryClient.setQueryData(queryKey, valueToStore)
      queryClient.invalidateQueries({ queryKey })
    },
    // initialValue is intentionally excluded: the function body reads the
    // current value via queryClient.getQueryData so it doesn't close over
    // initialValue reactively — including it would cause a new function
    // reference every render when callers pass an inline literal (e.g. []).
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key, queryKey, queryClient]
  )

  return [storedValue, setValue, { isSuccess, isLoading, isError, error }] as const
}
