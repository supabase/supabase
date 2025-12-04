'use client'

import { createContext, useContext, useState, type ReactNode } from 'react'

export type WrappedPage = 'home' | 'intro' | 'year-of-ai' | 'devs'

interface WrappedContextValue {
  currentPage: WrappedPage
  setCurrentPage: (page: WrappedPage) => void
}

const WrappedContext = createContext<WrappedContextValue | null>(null)

export function WrappedProvider({ children }: { children: ReactNode }) {
  const [currentPage, setCurrentPage] = useState<WrappedPage>('home')

  return (
    <WrappedContext.Provider value={{ currentPage, setCurrentPage }}>
      {children}
    </WrappedContext.Provider>
  )
}

export function useWrapped() {
  const context = useContext(WrappedContext)
  if (!context) {
    throw new Error('useWrapped must be used within a WrappedProvider')
  }
  return context
}
