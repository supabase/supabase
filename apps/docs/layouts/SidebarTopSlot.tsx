'use client'

import { createContext, useContext, useState, type PropsWithChildren } from 'react'

interface SidebarTopSlot {
  target: HTMLElement | null
  setTarget: (target: HTMLElement | null) => void
}

const SidebarTopSlotContext = createContext<SidebarTopSlot>({
  target: null,
  setTarget: () => {},
})

export const SidebarTopSlotProvider = ({ children }: PropsWithChildren) => {
  const [target, setTarget] = useState<HTMLElement | null>(null)
  return <SidebarTopSlotContext value={{ target, setTarget }}>{children}</SidebarTopSlotContext>
}

export const useSidebarTopSlot = () => useContext(SidebarTopSlotContext)
