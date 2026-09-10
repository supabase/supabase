'use client'

import { createContext, useContext } from 'react'

export interface MobileSidebarContextType {
  open: boolean
  setOpen: (open: boolean) => void
  toggle: () => void
}

export const MobileSidebarContext = createContext<MobileSidebarContextType | null>(null)

export function useMobileSidebar(): MobileSidebarContextType {
  const context = useContext(MobileSidebarContext)

  if (context === null) {
    throw new Error(
      'useMobileSidebar must be used within a MobileSidebarProvider. ' +
        'Ensure your component is wrapped with MobileSidebarProvider.'
    )
  }

  return context
}
