'use client'

import { createContext, useContext, type PropsWithChildren } from 'react'
import { createPortal } from 'react-dom'

interface SlotProviderProps extends PropsWithChildren {
  value: HTMLElement | null
}

const UpdatedAtSlotContext = createContext<HTMLElement | null>(null)

export const UpdatedAtSlotProvider = ({ value, children }: SlotProviderProps) => (
  <UpdatedAtSlotContext value={value}>{children}</UpdatedAtSlotContext>
)

export const UpdatedAtSlotPortal = ({ children }: PropsWithChildren) => {
  const target = useContext(UpdatedAtSlotContext)
  return target ? createPortal(children, target) : null
}
