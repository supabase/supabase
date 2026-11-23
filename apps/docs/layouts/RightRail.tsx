'use client'

import { useBreakpoint } from 'common/hooks/useBreakpoint'
import { createContext, useContext, type PropsWithChildren } from 'react'
import { createPortal } from 'react-dom'
import { ScrollBar, ScrollRoot, ScrollViewport } from 'ui'

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

// the rail shows from lg, so below it the content stays in place for the mobile drawer
export const RightRailOnDesktop = ({ children }: PropsWithChildren) => {
  const target = useContext(RightRailContext)
  const isBelowDesktop = useBreakpoint('lg')
  return target && !isBelowDesktop
    ? createPortal(
        <ScrollRoot className="flex min-h-0 flex-1 flex-col">
          <ScrollViewport className="p-6">{children}</ScrollViewport>
          <ScrollBar />
        </ScrollRoot>,
        target
      )
    : children
}
