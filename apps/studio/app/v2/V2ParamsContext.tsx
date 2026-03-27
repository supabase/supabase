'use client'

import { useParams } from 'next/navigation'
import { createContext, useContext, type ReactNode } from 'react'

export interface V2Params {
  orgSlug: string | undefined
  projectRef: string | undefined
}

const V2ParamsContext = createContext<V2Params>({
  orgSlug: undefined,
  projectRef: undefined,
})

/** Use in project scope: params have projectRef; orgSlug is passed in after being derived from project. */
export function V2ParamsProvider({
  children,
  projectRef,
  orgSlug,
}: {
  children: ReactNode
  projectRef: string | undefined
  orgSlug: string | undefined
}) {
  return (
    <V2ParamsContext.Provider value={{ orgSlug, projectRef }}>{children}</V2ParamsContext.Provider>
  )
}

/** Use in org scope: params have orgSlug only. */
export function V2OrgParamsProvider({ children }: { children: ReactNode }) {
  const params = useParams()
  const orgSlug = params?.orgSlug as string | undefined

  return (
    <V2ParamsContext.Provider value={{ orgSlug, projectRef: undefined }}>
      {children}
    </V2ParamsContext.Provider>
  )
}

export function useV2Params(): V2Params {
  const ctx = useContext(V2ParamsContext)
  if (!ctx) {
    return { orgSlug: undefined, projectRef: undefined }
  }
  return ctx
}
