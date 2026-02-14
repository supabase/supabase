import { useEffect, useState } from 'react'

// [Joshen] Copying from uidotdev/usehooks instead of installing the whole package
// https://github.com/uidotdev/usehooks/blob/945436df0037bc21133379a5e13f1bd73f1ffc36/index.js#L239
export function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}
