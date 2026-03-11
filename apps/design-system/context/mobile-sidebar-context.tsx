'use client'

import React, { ReactNode, useCallback, useState } from 'react'

import { MobileSidebarContext, MobileSidebarContextType } from '@/hooks/use-mobile-sidebar'

interface MobileSidebarProviderProps {
  children: ReactNode
}

/**
 * Provider component for mobile sidebar state
 * Wraps children with context that provides mobile sidebar state and controls
 */
export function MobileSidebarProvider({ children }: MobileSidebarProviderProps) {
  const [open, setOpen] = useState(false)

  // Use useCallback for stable function references
  const handleSetOpen = useCallback((value: boolean) => {
    setOpen(value)
  }, [])

  const toggle = useCallback(() => {
    setOpen((prev) => !prev)
  }, [])

  // Memoize the context value to prevent unnecessary re-renders
  const value: MobileSidebarContextType = {
    open,
    setOpen: handleSetOpen,
    toggle,
  }

  return <MobileSidebarContext.Provider value={value}>{children}</MobileSidebarContext.Provider>
}
