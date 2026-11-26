'use client'

import { safeLocalStorage } from 'common'
import { createContext, useContext, useEffect, useState } from 'react'

import { frameworkTitles } from '@/config/docs'

type Framework = keyof typeof frameworkTitles
type FrameworkContextType = {
  framework: Framework
  setFramework: (framework: Framework) => void
}

const FrameworkPreferenceContext = createContext<FrameworkContextType | undefined>(undefined)

export function FrameworkPreferenceProvider({ children }: { children: React.ReactNode }) {
  const [framework, setFrameworkState] = useState<Framework>('nextjs')

  // Initialize from localStorage on mount (client-side only)
  useEffect(() => {
    const storedFramework = safeLocalStorage.getItem('preferredFramework')
    if (storedFramework && Object.keys(frameworkTitles).includes(storedFramework)) {
      setFrameworkState(storedFramework as Framework)
    }
  }, [])

  // Update localStorage when framework changes
  const setFramework = (newFramework: Framework) => {
    setFrameworkState(newFramework)
    safeLocalStorage.setItem('preferredFramework', newFramework)
  }

  return (
    <FrameworkPreferenceContext.Provider value={{ framework, setFramework }}>
      {children}
    </FrameworkPreferenceContext.Provider>
  )
}

// Custom hook to use the framework context
export function useFrameworkPreference() {
  const context = useContext(FrameworkPreferenceContext)
  if (context === undefined) {
    throw new Error('useFrameworkPreference must be used within a FrameworkPreferenceProvider')
  }
  return context
}
