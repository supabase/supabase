'use client'

import { Activity, EyeOff } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { MouseEvent } from 'react'
import { Button, PopoverContent_Shadcn_, PopoverTrigger_Shadcn_, Popover_Shadcn_, cn } from 'ui'

import { useDevToolbar } from './DevToolbarContext'

const IS_LOCAL_DEV = process.env.NODE_ENV === 'development'

export function DevToolbarTrigger() {
  const { isEnabled, isOpen, setIsOpen, events, dismissToolbar } = useDevToolbar()
  const [popoverOpen, setPopoverOpen] = useState(false)
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current)
        closeTimeoutRef.current = null
      }
    }
  }, [])

  if (!IS_LOCAL_DEV || !isEnabled) {
    return null
  }

  const eventCount = events.length

  const handleClick = () => {
    setPopoverOpen(false)
    setIsOpen(true)
  }

  const handleDismiss = () => {
    setPopoverOpen(false)
    dismissToolbar()
  }

  const handleMouseEnter = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current)
      closeTimeoutRef.current = null
    }
    setPopoverOpen(true)
  }

  const handleMouseLeave = () => {
    closeTimeoutRef.current = setTimeout(() => {
      setPopoverOpen(false)
    }, 100)
  }

  const handleTriggerMouseLeave = (event: MouseEvent<HTMLButtonElement>) => {
    handleMouseLeave()
    event.currentTarget.blur()
  }

  return (
    <Popover_Shadcn_ open={popoverOpen} onOpenChange={setPopoverOpen}>
      <PopoverTrigger_Shadcn_ asChild>
        <Button
          type="text"
          className={cn(
            'relative rounded-full h-[32px] px-2',
            'text-foreground-light hover:text-foreground',
            'focus-visible:outline-0 focus-visible:outline-transparent focus-visible:outline-offset-0',
            isOpen && 'text-foreground bg-surface-300'
          )}
          aria-label="Open dev toolbar"
          onClick={handleClick}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleTriggerMouseLeave}
        >
          <Activity className="w-4 h-4" />
          {eventCount > 0 && (
            <span
              className={cn(
                'absolute -top-1 -right-1',
                'h-4 min-w-4 px-0.5',
                'inline-flex items-center justify-center',
                'rounded-full bg-destructive text-white',
                'text-[10px] font-medium leading-none'
              )}
            >
              {eventCount > 99 ? '99+' : eventCount}
            </span>
          )}
        </Button>
      </PopoverTrigger_Shadcn_>
      <PopoverContent_Shadcn_
        side="left"
        align="center"
        sideOffset={4}
        className="w-auto p-1"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        <button
          type="button"
          className="flex items-center gap-2 px-2 py-1.5 text-sm rounded hover:bg-surface-200 text-foreground-light hover:text-foreground whitespace-nowrap"
          onClick={handleDismiss}
        >
          <EyeOff className="w-4 h-4 shrink-0" />
          <span>Hide</span>
        </button>
      </PopoverContent_Shadcn_>
    </Popover_Shadcn_>
  )
}
