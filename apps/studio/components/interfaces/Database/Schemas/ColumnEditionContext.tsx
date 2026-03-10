import { createContext, useContext, type ReactNode } from 'react'

export type ColumnEditionContextType = {
  onEditColumn: (tableId: number, columnId: string) => void
}

export const ColumnEditionContext = createContext<ColumnEditionContextType | null>(null)

export const ColumnEditionContextProvider = ({
  children,
  value,
}: {
  children: ReactNode
  value: ColumnEditionContextType
}) => <ColumnEditionContext.Provider value={value}>{children}</ColumnEditionContext.Provider>

export const useColumnEditionContext = () => {
  const context = useContext(ColumnEditionContext)
  if (!context)
    throw new Error('useColumnEditionContext must be used inside a <ColumnEditionContextProvider>')
  return context
}
