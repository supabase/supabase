'use client'

import { useRouter as useLegacyRouter } from 'next/compat/router'
import { useRouter as useNextRouter } from 'next/navigation'
import { createContext, useContext, useEffect, useMemo, useRef, useTransition } from 'react'

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
  if (onlyTo && value !== onlyTo) result = false

  prev.current = value

  return result
}

export function useCrossCompatRouter() {
  const { onPendingEnd } = useCrossCompatRouterContext()

  const legacyRouter = useLegacyRouter()
  const newRouter = useNextRouter()
  const isUsingLegacyRouting = !!legacyRouter

  const [isPending, startTransition] = useTransition()
  const hasPendingEnded = useHasChanged(isPending, { onlyTo: false })
  if (!isUsingLegacyRouting && hasPendingEnded) {
    onPendingEnd.forEach((fn) => fn())
  }

  const api = useMemo(
    () => ({
      push: (path: string) => {
        if (isUsingLegacyRouting) {
          legacyRouter.push(path)
        } else {
          startTransition(() => {
            newRouter.push(path)
          })
        }
      },
    }),
    [isUsingLegacyRouting, legacyRouter, newRouter]
  )

  return api
}
