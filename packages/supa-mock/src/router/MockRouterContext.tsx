import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import type { MockRouterContextType } from '../types'

const MockRouterContext = createContext<MockRouterContextType | null>(null)

export function useMockRouter(): MockRouterContextType {
  const ctx = useContext(MockRouterContext)
  if (!ctx) {
    throw new Error('useMockRouter must be used within a MockRouterProvider')
  }
  return ctx
}

interface MockRouterProviderProps {
  defaultPath: string
  children: ReactNode
}

export function MockRouterProvider({ defaultPath, children }: MockRouterProviderProps) {
  const [history, setHistory] = useState<string[]>([defaultPath])
  const currentPath = history[history.length - 1]

  const navigate = useCallback((path: string) => {
    setHistory((prev) => [...prev, path])
  }, [])

  const goBack = useCallback(() => {
    setHistory((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev))
  }, [])

  return (
    <MockRouterContext.Provider value={{ currentPath, navigate, goBack }}>
      {children}
    </MockRouterContext.Provider>
  )
}
