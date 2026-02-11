'use client'

import { createContext, useContext, useEffect, useState } from 'react'

import { frameworkTitles } from '@/config/docs'

type Framework = keyof typeof frameworkTitles
type FrameworkContextType = {
  framework: Framework
  setFramework: (framework: Framework) => void
}

const FrameworkContext = createContext<FrameworkContextType | undefined>(undefined)

export function FrameworkProvider({ children }: { children: React.ReactNode }) {
  const [framework, setFrameworkState] = useState<Framework>('nextjs')

  // Initialize from localStorage on mount (client-side only)
  useEffect(() => {
    const storedFramework = localStorage.getItem('preferredFramework')
    if (storedFramework && Object.keys(frameworkTitles).includes(storedFramework)) {
      setFrameworkState(storedFramework as Framework)
    }
  }, [])

  // Update localStorage when framework changes
  const setFramework = (newFramework: Framework) => {
    setFrameworkState(newFramework)
    localStorage.setItem('preferredFramework', newFramework)
  }

  return (
    <FrameworkContext.Provider value={{ framework, setFramework }}>
      {children}
    </FrameworkContext.Provider>
  )
}

// Custom hook to use the framework context
export function useFramework() {
  const context = useContext(FrameworkContext)
  if (context === undefined) {
    throw new Error('useFramework must be used within a FrameworkProvider')
  }
  return context
}
