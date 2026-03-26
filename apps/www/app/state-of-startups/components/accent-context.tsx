'use client'

import { createContext, useContext } from 'react'

export type Accent = 'green' | 'purple'

export const AccentContext = createContext<Accent>('green')

export function useAccent() {
  return useContext(AccentContext)
}
