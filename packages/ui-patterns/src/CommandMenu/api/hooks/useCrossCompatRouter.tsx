'use client'

import { useFramework } from 'common'
import { createContext, useContext, useMemo, useRef, useTransition } from 'react'

type Handler = (...evts: any[]) => void

export const CrossCompatRouterContext = createContext<{ onPendingEnd: Set<Handler> } | undefined>(
  undefined
)

function useCrossCompatRouterContext() {
  const ctx = useContext(CrossCompatRouterContext)
  if (!ctx) {
    throw Error(
      'useCrossCompatRouterContext must be used within a CrossCompatRouterContext.Provider'
    )
  }
  return ctx
}

function useHasChanged<T>(value: T, { onlyTo }: { onlyTo?: T } = {}) {
  const prev = useRef(value)

  let result = true

  if (prev.current === value) result = false
  if (onlyTo !== undefined && value !== onlyTo) result = false

  prev.current = value

  return result
}

export function useCrossCompatRouter() {
  const { onPendingEnd } = useCrossCompatRouterContext()
  const { push: frameworkPush } = useFramework()

  const [isPending, startTransition] = useTransition()
  const hasPendingEnded = useHasChanged(isPending, { onlyTo: false })
  if (hasPendingEnded) {
    onPendingEnd.forEach((fn) => fn())
  }

  const api = useMemo(
    () => ({
      push: (path: string) => {
        startTransition(async () => {
          if (frameworkPush) {
            try {
              await frameworkPush(path)
            } catch (error) {
              console.error('Failed to navigate:', error)
            }
          } else if (typeof window !== 'undefined') {
            window.location.assign(path)
          }
        })
      },
    }),
    [frameworkPush]
  )

  return api
}
