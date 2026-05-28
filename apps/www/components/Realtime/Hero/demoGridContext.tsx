'use client'

import { createContext, use } from 'react'

import type { CellFocusPayload } from './types'

const DemoGridContext = createContext<Record<string, CellFocusPayload> | null>(null)

export function DemoGridProvider({
  focusedCells,
  children,
}: {
  focusedCells: Record<string, CellFocusPayload>
  children: React.ReactNode
}) {
  return <DemoGridContext value={focusedCells}>{children}</DemoGridContext>
}

export function useDemoGridFocus() {
  const context = use(DemoGridContext)
  if (!context) {
    throw new Error('useDemoGridFocus must be used within DemoGridProvider')
  }
  return context
}

export const cellKey = (rowId: string, columnKey: string) => `${rowId}:${columnKey}`
