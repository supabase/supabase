'use client'

import { useRouter as useLegacyRouter } from 'next/compat/router'
import { useRouter as useNextRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useTransition } from 'react'
import { usePrevious } from 'react-use'

type Handler = (...evts: any[]) => void

function useHasChanged<T>(value: T, { onlyTo }: { onlyTo?: T } = {}) {
  const prev = usePrevious(value)

  if (prev === value) return false
  if (onlyTo && value !== onlyTo) return false

  return true
}

function useCrossCompatRouter() {
  const legacyRouter = useLegacyRouter()
  const newRouter = useNextRouter()
  const isUsingLegacyRouting = !!legacyRouter

  const [isPending, startTransition] = useTransition()
  const hasPendingEnded = useHasChanged(isPending, { onlyTo: false })
  const onPendingEnd = useRef(new Set<() => void>())
  useEffect(() => {
    if (!isUsingLegacyRouting && hasPendingEnded) {
      onPendingEnd.current.forEach((fn) => fn())
    }
  }, [hasPendingEnded, isUsingLegacyRouting])

  const api = useMemo(
    () => ({
      events: {
        onRouteChangeComplete: (fn: Handler) => {
          if (isUsingLegacyRouting) {
            legacyRouter.events.on('routeChangeComplete', fn)
          } else {
            onPendingEnd.current.add(fn)
          }
        },
        offRouteChangeComplete: (fn: Handler) => {
          if (isUsingLegacyRouting) {
            legacyRouter.events.off('routeChangeComplete', fn)
          } else {
            onPendingEnd.current.delete(fn)
          }
        },
      },
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
    []
  )

  return api
}

export { useCrossCompatRouter }
