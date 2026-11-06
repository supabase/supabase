import { useState } from 'react'
import { useDebounce } from 'react-use'

export const useDebouncedValue = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useDebounce(
    () => {
      setDebouncedValue(value)
    },
    delay,
    [value]
  )

  return debouncedValue
}
