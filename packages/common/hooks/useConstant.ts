'use client'

// based on https://github.com/Andarist/use-constant
import { useRef } from 'react'

type ResultBox<T> = { v: T }

/**
 * React hook for creating a value exactly once
 */
export function useConstant<T>(fn: () => T): T {
  const ref = useRef<ResultBox<T>>()

  if (!ref.current) {
    ref.current = { v: fn() }
  }

  return ref.current.v
}
