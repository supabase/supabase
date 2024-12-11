import React, { createContext } from 'react'

export interface SheetContextType {
  openSheet: () => void
  closeSheet: () => void
  isOpen: boolean
  setMenu: (menu: React.ReactNode) => void
}

const SheetContext = createContext<SheetContextType | undefined>(undefined)

export default SheetContext
