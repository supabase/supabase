'use client'

import { createContext, useContext, type PropsWithChildren } from 'react'
import { createPortal } from 'react-dom'

interface SlotProviderProps extends PropsWithChildren {
  value: HTMLElement | null
}

const RightRailContext = createContext<HTMLElement | null>(null)

export const RightRailProvider = ({ value, children }: SlotProviderProps) => (
  <RightRailContext value={value}>{children}</RightRailContext>
)

export const RightRailPortal = ({ children }: PropsWithChildren) => {
  const target = useContext(RightRailContext)
  return target ? createPortal(children, target) : null
}
