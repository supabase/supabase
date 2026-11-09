'use client'

import { ChevronDown } from 'lucide-react'
import { useRef, useState, type KeyboardEvent, type MouseEvent } from 'react'
import { cn } from 'ui'

import { HeadingReel } from './heading-reel'
import type { TOCItemType } from './server/get-toc'
import { TocTree } from './toc'
import * as Primitive from './toc-primitive'

export interface TocMenuProps {
  items: TOCItemType[]
  className?: string
}

// needs an AnchorProvider above it
export const TocMenu = ({ items, className }: TocMenuProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [drawerTop, setDrawerTop] = useState(0)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const anchors = new Set(Primitive.useActiveAnchors())
  const activeIndex = items.findIndex((item) => anchors.has(item.url.slice(1)))
  // the topmost visible heading, or the first one before any heading is in view
  const index = Math.max(activeIndex, 0)

  if (items.length === 0) return null

  const handleToggle = (event: MouseEvent<HTMLButtonElement>) => {
    setDrawerTop(event.currentTarget.getBoundingClientRect().bottom)
    setIsOpen(!isOpen)
  }
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Escape' || !isOpen) return
    setIsOpen(false)
    // the list unmounts, so focus on one of its links would fall back to the page
    triggerRef.current?.focus()
  }
  // close once a heading is picked so the drawer doesn't cover the jump
  const handleLinkClick = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target instanceof Element && event.target.closest('a')) setIsOpen(false)
  }

  return (
    <div
      data-toc-menu
      onKeyDown={handleKeyDown}
      className={cn('relative border-b border-default bg-background', className)}
    >
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={isOpen}
        onClick={handleToggle}
        className="flex h-10 w-full items-center gap-2.5 text-left text-sm text-foreground-light focus-ring"
      >
        {isOpen ? null : <span className="sr-only">On this page:</span>}
        <HeadingReel id={isOpen ? 'toc-open' : items[index].url} index={isOpen ? -1 : index}>
          {isOpen ? 'On this page' : items[index].title}
        </HeadingReel>
        <ChevronDown
          aria-hidden
          strokeWidth={2}
          className={cn(
            'ms-auto size-3.5 shrink-0 text-foreground-muted',
            'transition-transform duration-200 ease-out motion-reduce:transition-none',
            isOpen && 'rotate-180'
          )}
        />
      </button>
      {/* rendered only while open, so each open starts at the first heading */}
      {isOpen ? (
        <div
          onClick={handleLinkClick}
          style={{ top: drawerTop }}
          className="fixed inset-x-0 bottom-0 overflow-y-auto overscroll-contain bg-inherit px-[inherit]"
        >
          <TocTree items={items} activeUrl={items[activeIndex]?.url} className="pb-8" />
        </div>
      ) : null}
    </div>
  )
}
