'use client'

import { createContext, type PropsWithChildren, useContext, useMemo } from 'react'

export type RouteParamsOverride = Record<string, string | undefined>

const RouteParamsOverrideContext = createContext<RouteParamsOverride | undefined>(undefined)

export function RouteParamsOverrideProvider({
  value,
  children,
}: PropsWithChildren<{ value: RouteParamsOverride }>) {
  // Keep referential stability for consumers.
  const memoValue = useMemo(() => value, [value])

  return (
    <RouteParamsOverrideContext.Provider value={memoValue}>
      {children}
    </RouteParamsOverrideContext.Provider>
  )
}

export function useRouteParamsOverride() {
  return useContext(RouteParamsOverrideContext)
}
