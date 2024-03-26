import { useRef } from 'react'

/**
 * Once a non-undefined value is passed, it will never change.
 */
export function useImmutableValue<T>(value: T | undefined): T | undefined {
  const ref = useRef<T | undefined>(value)

  if (!ref.current && value) {
    ref.current = value
  }

  return ref.current
}
