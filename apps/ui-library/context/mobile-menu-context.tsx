'use client'

import React, { ReactNode, useCallback, useState } from 'react'

import { MobileMenuContext, MobileMenuContextType } from '@/hooks/use-mobile-menu'

interface MobileMenuProviderProps {
  children: ReactNode
}

/**
 * Provider component for mobile menu state
 * Wraps children with context that provides mobile menu state and controls
 */
export function MobileMenuProvider({ children }: MobileMenuProviderProps) {
  const [open, setOpen] = useState(false)

  // Use useCallback for stable function references
  const handleSetOpen = useCallback((value: boolean) => {
    setOpen(value)
  }, [])

  const toggle = useCallback(() => {
    setOpen((prev) => {
      return !prev
    })
  }, [])

  // Memoize the context value to prevent unnecessary re-renders
  const value: MobileMenuContextType = {
    open,
    setOpen: handleSetOpen,
    toggle,
  }

  return <MobileMenuContext.Provider value={value}>{children}</MobileMenuContext.Provider>
}
