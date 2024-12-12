'use client'

import React, { createContext } from 'react'

export interface SheetContextType {
  openSheet: () => void
  closeSheet: () => void
  isOpen: boolean
  setSheetContent: (menu: React.ReactNode) => void
}

const SheetContext = createContext<SheetContextType | undefined>(undefined)

export default SheetContext
