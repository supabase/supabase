'use client'

import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'

type CommunityDocsSearchContextValue = {
  query: string
  setQuery: (query: string) => void
}

const CommunityDocsSearchContext = createContext<CommunityDocsSearchContextValue | undefined>(
  undefined
)

const CommunityDocsSearchProvider = ({ children }: { children: ReactNode }) => {
  const [query, setQuery] = useState('')
  const value = useMemo(() => ({ query, setQuery }), [query])

  return (
    <CommunityDocsSearchContext.Provider value={value}>
      {children}
    </CommunityDocsSearchContext.Provider>
  )
}

const useCommunityDocsSearch = () => {
  const context = useContext(CommunityDocsSearchContext)

  if (!context) {
    throw new Error('useCommunityDocsSearch must be used within CommunityDocsSearchProvider')
  }

  return context
}

export { CommunityDocsSearchProvider, useCommunityDocsSearch }
