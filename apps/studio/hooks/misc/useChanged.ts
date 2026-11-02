import { useEffect, useRef } from 'react'

export function useChanged<T>(value: T): boolean {
  const prev = useRef<T>(null)
  const changed = prev.current !== value

  useEffect(() => {
    prev.current = value
  })

  return changed
}

export function useChangedSync<T>(value: T): boolean {
  const prev = useRef<T>(null)
  const changed = prev.current !== value
  prev.current = value

  return changed
}
