import { createContext, useContext, type ReactNode } from 'react'
import type { MockUser, MockUserContextType } from '../types'

const MockUserContext = createContext<MockUserContextType | null>(null)

export function useMockUser(): MockUserContextType {
  const ctx = useContext(MockUserContext)
  if (!ctx) {
    throw new Error('useMockUser must be used within a MockUserProvider')
  }
  return ctx
}

const DEFAULT_USER: MockUser = {
  id: 'mock-user-id',
  email: 'user@example.com',
  displayName: 'Mock User',
}

interface MockUserProviderProps {
  children: ReactNode
}

export function MockUserProvider({ children }: MockUserProviderProps) {
  return <MockUserContext.Provider value={{ user: DEFAULT_USER }}>{children}</MockUserContext.Provider>
}
