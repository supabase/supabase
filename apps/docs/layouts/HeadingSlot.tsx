'use client'

import { createContext, useContext, type PropsWithChildren, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { HeadingReel } from 'ui-patterns/Toc/heading-reel'

interface SlotProviderProps extends PropsWithChildren {
  value: HTMLElement | null
}

export interface CrumbHeading {
  url: string
  title: ReactNode
}

interface HeadingSlotCrumbProps {
  heading: CrumbHeading | undefined
  index: number
}

const HeadingSlotContext = createContext<HTMLElement | null>(null)

export const HeadingSlotProvider = ({ value, children }: SlotProviderProps) => (
  <HeadingSlotContext value={value}>{children}</HeadingSlotContext>
)

const HeadingSlotPortal = ({ children }: PropsWithChildren) => {
  const target = useContext(HeadingSlotContext)
  return target ? createPortal(children, target) : null
}

export const HeadingSlotCrumb = ({ heading, index }: HeadingSlotCrumbProps) =>
  heading ? (
    <HeadingSlotPortal>
      <span aria-hidden className="size-1 shrink-0 bg-foreground-muted" />
      <HeadingReel id={heading.url} index={index} className="h-4.5 overflow-hidden text-foreground">
        {heading.title}
      </HeadingReel>
    </HeadingSlotPortal>
  ) : null
