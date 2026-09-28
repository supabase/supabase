'use client'

import { createContext, useContext, useState, type PropsWithChildren, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

interface SlotProviderProps extends PropsWithChildren {
  value: HTMLElement | null
}

interface CrumbHeading {
  url: string
  title: ReactNode
}

interface HeadingSlotCrumbProps {
  heading: CrumbHeading | undefined
  index: number
}

interface HeadingRoll {
  active: CrumbHeading | undefined
  previous: CrumbHeading | undefined
  index: number
  direction: 'forward' | 'backward'
}

const HeadingSlotContext = createContext<HTMLElement | null>(null)

export const HeadingSlotProvider = ({ value, children }: SlotProviderProps) => (
  <HeadingSlotContext value={value}>{children}</HeadingSlotContext>
)

export const HeadingSlotPortal = ({ children }: PropsWithChildren) => {
  const target = useContext(HeadingSlotContext)
  return target ? createPortal(children, target) : null
}

export const HeadingSlotCrumb = ({ heading, index }: HeadingSlotCrumbProps) => {
  const [roll, setRoll] = useState<HeadingRoll>({
    active: heading,
    previous: undefined,
    index,
    direction: 'forward',
  })

  if (roll.active?.url !== heading?.url) {
    setRoll({
      active: heading,
      previous: roll.active,
      index,
      direction: index >= roll.index ? 'forward' : 'backward',
    })
  }

  if (!roll.active) return null

  return (
    <HeadingSlotPortal>
      <span aria-hidden className="size-1 shrink-0 bg-foreground-muted" />
      <span className="docs-heading-reel relative block h-4.5 min-w-0 overflow-hidden">
        {roll.previous ? (
          <span
            key={`previous-${roll.previous.url}-${roll.active.url}`}
            aria-hidden
            data-direction={roll.direction}
            data-roll-role="previous"
            className="docs-heading-roll pointer-events-none absolute inset-x-0 top-0 block whitespace-nowrap text-foreground"
          >
            {roll.previous.title}
          </span>
        ) : null}
        <span
          key={roll.active.url}
          data-direction={roll.direction}
          data-roll-role="current"
          className="docs-heading-roll relative block truncate text-foreground"
        >
          {roll.active.title}
        </span>
      </span>
    </HeadingSlotPortal>
  )
}
