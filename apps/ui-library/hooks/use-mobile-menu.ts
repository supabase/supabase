'use client'

import { createContext, useContext } from 'react'

/**
 * Context type for mobile menu state and controls
 */
export interface MobileMenuContextType {
  /** Current state of the mobile menu */
  open: boolean
  /** Function to set the mobile menu state */
  setOpen: (open: boolean) => void
  /** Function to toggle the mobile menu state */
  toggle: () => void
}

// Create context with null as default value to indicate it's not provided
export const MobileMenuContext = createContext<MobileMenuContextType | null>(null)

/**
 * Hook to access the mobile menu state and controls
 * Must be used within a MobileMenuProvider
 */
export function useMobileMenu(): MobileMenuContextType {
  const context = useContext(MobileMenuContext)

  if (context === null) {
    throw new Error(
      'useMobileMenu must be used within a MobileMenuProvider. ' +
        'Ensure your component is wrapped with MobileMenuProvider.'
    )
  }

  return context
}
