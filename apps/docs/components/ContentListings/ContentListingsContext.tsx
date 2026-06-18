'use client'

import { type ContentListingGroup } from '~/lib/content-listings.schema'
import { createContext, use, useCallback, useMemo, useState, type ReactNode } from 'react'

interface ContentListingsContextValue {
  groups: ContentListingGroup[]
  markInlinePlaced: (listingId: string) => void
  inlinePlacedIds: ReadonlySet<string>
}

const ContentListingsContext = createContext<ContentListingsContextValue | null>(null)

export function ContentListingsProvider({
  groups,
  children,
}: {
  groups: ContentListingGroup[]
  children: ReactNode
}) {
  const [inlinePlacedIds, setInlinePlacedIds] = useState<ReadonlySet<string>>(() => new Set())

  const markInlinePlaced = useCallback((listingId: string) => {
    setInlinePlacedIds((current) => {
      if (current.has(listingId)) {
        return current
      }
      return new Set([...current, listingId])
    })
  }, [])

  const value = useMemo(
    () => ({
      groups,
      markInlinePlaced,
      inlinePlacedIds,
    }),
    [groups, markInlinePlaced, inlinePlacedIds]
  )

  return <ContentListingsContext value={value}>{children}</ContentListingsContext>
}

export function useContentListingsContext() {
  const context = use(ContentListingsContext)
  if (!context) {
    throw new Error('ContentListings components must be used within ContentListingsProvider')
  }
  return context
}

export function useOptionalContentListingsContext() {
  return use(ContentListingsContext)
}
