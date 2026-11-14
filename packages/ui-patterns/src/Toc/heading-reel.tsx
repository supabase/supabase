'use client'

import { useState, type ReactNode } from 'react'
import { cn } from 'ui'

export interface HeadingReelProps {
  // a new id rolls the new children in
  id: string
  // a higher index than the last one rolls up, a lower one rolls down
  index: number
  children: ReactNode
  className?: string
}

interface HeadingRoll {
  activeId: string
  activeContent: ReactNode
  previous: { id: string; content: ReactNode } | undefined
  index: number
  direction: 'forward' | 'backward'
}

export const HeadingReel = ({ id, index, children, className }: HeadingReelProps) => {
  const [roll, setRoll] = useState<HeadingRoll>({
    activeId: id,
    activeContent: children,
    previous: undefined,
    index,
    direction: 'forward',
  })

  if (roll.activeId !== id) {
    setRoll({
      activeId: id,
      activeContent: children,
      previous: { id: roll.activeId, content: roll.activeContent },
      index,
      direction: index >= roll.index ? 'forward' : 'backward',
    })
  }

  return (
    <span
      className={cn(
        'toc-heading-reel relative block h-5 min-w-0 [clip-path:inset(0_-100vw)]',
        className
      )}
    >
      {roll.previous ? (
        <span
          key={roll.previous.id}
          aria-hidden
          data-direction={roll.direction}
          data-roll-role="previous"
          className="toc-heading-roll pointer-events-none absolute left-0 top-0 block w-max"
        >
          {roll.previous.content}
        </span>
      ) : null}
      <span
        key={id}
        data-direction={roll.direction}
        data-roll-role="current"
        className="toc-heading-roll relative block truncate"
      >
        {children}
      </span>
    </span>
  )
}
