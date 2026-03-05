import type { PropsWithChildren } from 'react'
import { createContext, useCallback, useContext, useState } from 'react'

export type MobileSheetContentType = null | string

type MobileSheetContextValue = {
  content: MobileSheetContentType
  setContent: (content: MobileSheetContentType) => void
}

const MobileSheetContext = createContext<MobileSheetContextValue | null>(null)

export function MobileSheetProvider({ children }: PropsWithChildren) {
  const [content, setContentState] = useState<MobileSheetContentType>(null)

  const setContent = useCallback((next: MobileSheetContentType) => {
    setContentState(next)
  }, [])

  return (
    <MobileSheetContext.Provider value={{ content, setContent }}>
      {children}
    </MobileSheetContext.Provider>
  )
}

export function useMobileSheet(): MobileSheetContextValue {
  const ctx = useContext(MobileSheetContext)
  if (!ctx) {
    throw new Error('useMobileSheet must be used within MobileSheetProvider')
  }
  return ctx
}
