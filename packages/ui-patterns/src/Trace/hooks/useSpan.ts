import { createContext, use } from 'react'

import type { SpanContextValue } from '../types'

export const SpanContext = createContext<SpanContextValue | null>(null)

export function useSpan(): SpanContextValue {
  const value = use(SpanContext)
  if (!value) throw new Error('This part must be rendered inside the Trace.Rows template')
  return value
}
