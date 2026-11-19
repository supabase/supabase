'use client'

import { usePathname, useSelectedLayoutSegments } from 'next/navigation'
import { createContext, useContext, type PropsWithChildren } from 'react'

import {
  IA_NAV_ROUTE_SEGMENT,
  iaNavRoutePrefix,
  isIaNavVariant,
  type IaNavVariant,
} from './constants'

const IaNavRouteContext = createContext<IaNavVariant | null>(null)

/**
 * Provides the variant forced by the route that the proxy rewrote the request to.
 * Render it in the root layout: the segments it reads are relative to its layout.
 */
export function IaNavRouteProvider({ children }: PropsWithChildren) {
  const [segment, variant] = useSelectedLayoutSegments()
  const routeVariant = segment === IA_NAV_ROUTE_SEGMENT && isIaNavVariant(variant) ? variant : null

  return <IaNavRouteContext.Provider value={routeVariant}>{children}</IaNavRouteContext.Provider>
}

export function useIaNavRouteVariant(): IaNavVariant | null {
  return useContext(IaNavRouteContext)
}

/**
 * The page's public pathname. On the server, `usePathname` returns the rewritten
 * variant route, so this strips its prefix to match what the browser sees.
 * The rewritten route encodes the slashes inside a nested slug, so it is decoded too.
 */
export function useDocsPathname(): string {
  const pathname = usePathname()
  const routeVariant = useIaNavRouteVariant()
  if (!routeVariant) return pathname

  const prefix = iaNavRoutePrefix(routeVariant)
  if (!pathname.startsWith(prefix)) return pathname
  return decodeURIComponent(pathname.slice(prefix.length)) || '/'
}
