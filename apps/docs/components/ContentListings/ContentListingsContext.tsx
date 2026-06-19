'use client'

import { type ContentListingGroup } from '~/lib/content-listings.schema'
import { createContext, use, useMemo, useRef, type ReactNode, type RefObject } from 'react'

interface ContentListingsContextValue {
  groups: ContentListingGroup[]
  markInlinePlaced: (listingId: string) => void
  inlinePlacedIdsRef: RefObject<Set<string>>
}

const ContentListingsContext = createContext<ContentListingsContextValue | null>(null)

/**
 * Supplies parsed contentListings groups and tracks which listing ids were placed inline in the MDX body.
 */
export function ContentListingsProvider({
  groups,
  children,
}: {
  groups: ContentListingGroup[]
  children: ReactNode
}) {
  const inlinePlacedIdsRef = useRef<Set<string>>(new Set())

  const value = useMemo(
    () => ({
      groups,
      markInlinePlaced: (listingId: string) => {
        inlinePlacedIdsRef.current.add(listingId)
      },
      inlinePlacedIdsRef,
    }),
    [groups]
  )

  return <ContentListingsContext value={value}>{children}</ContentListingsContext>
}

/**
 * Returns contentListings context. Throws if used outside ContentListingsProvider.
 */
export function useContentListingsContext() {
  const context = use(ContentListingsContext)
  if (!context) {
    throw new Error('ContentListings components must be used within ContentListingsProvider')
  }
  return context
}

/**
 * Returns contentListings context when inside a provider, or null otherwise.
 */
export function useOptionalContentListingsContext() {
  return use(ContentListingsContext)
}
