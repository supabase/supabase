'use client'

import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from 'react'

type StackItem = {
  title: string
  component: ReactNode
}

type SheetNavigationContextType = {
  stack: StackItem[]
  push: (item: StackItem) => void
  pop: () => void
  popTo: (index: number) => void
  reset: () => void
}

const SheetNavigationContext = createContext<SheetNavigationContextType | undefined>(undefined)

export function SheetNavigationProvider({
  children,
  onStackEmpty,
  initialStack = [],
}: {
  children: ReactNode
  onStackEmpty?: () => void
  initialStack?: StackItem[]
}) {
  const [stack, setStack] = useState<StackItem[]>(initialStack)

  const push = useCallback((item: StackItem) => {
    setStack((prev) => [...prev, item])
  }, [])

  const pop = useCallback(() => {
    setStack((prev) => {
      const newStack = prev.slice(0, -1)
      if (newStack.length === 0) {
        onStackEmpty?.()
      }
      return newStack
    })
  }, [onStackEmpty])

  const popTo = useCallback((index: number) => {
    if (index < 0) return
    setStack((prev) => prev.slice(0, index + 1))
  }, [])

  const reset = useCallback(() => {
    setStack([])
    onStackEmpty?.()
  }, [onStackEmpty])

  const value = useMemo(
    () => ({ stack, push, pop, popTo, reset }),
    [stack, push, pop, popTo, reset]
  )

  return <SheetNavigationContext.Provider value={value}>{children}</SheetNavigationContext.Provider>
}

export function useSheetNavigation() {
  const context = useContext(SheetNavigationContext)
  if (context === undefined) {
    throw new Error('useSheetNavigation must be used within a SheetNavigationProvider')
  }
  return context
}
