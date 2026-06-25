'use client'

import Image from 'next/image'
import { Button, cn } from 'ui'

import { useDevToolbar } from './DevToolbarContext'

// Duplicated for tree-shaking — bundler must see literal process.env reference.
// Keep in sync: index.ts, DevToolbarContext.tsx, DevToolbar.tsx, DevToolsDock.tsx
const env = process.env.NEXT_PUBLIC_ENVIRONMENT
const IS_TOOLBAR_ENABLED = env === 'local' || env === 'staging'

export function DevToolbarTrigger() {
  const { isEnabled, isOpen, setIsOpen, events } = useDevToolbar()

  if (!IS_TOOLBAR_ENABLED || !isEnabled) return null

  const eventCount = events.length

  return (
    <div
      className={cn(
        'transition-opacity duration-200',
        isOpen ? 'pointer-events-none opacity-0' : 'opacity-100'
      )}
    >
      <Button
        variant="text"
        className={cn(
          'relative h-10 w-10 rounded-full p-0',
          'border border-overlay bg-surface-100 shadow-md',
          'text-foreground-light hover:bg-surface-200 hover:text-foreground',
          'focus-visible:outline-0 focus-visible:outline-transparent focus-visible:outline-offset-0'
        )}
        aria-label="Open dev toolbar"
        onClick={() => setIsOpen(true)}
        title="Dev Toolbar"
      >
        <Image
          src="/img/logo-pixel-small-light.png"
          alt="Dev Toolbar"
          width={16}
          height={16}
          style={{
            filter:
              'brightness(0) saturate(100%) invert(72%) sepia(57%) saturate(431%) hue-rotate(108deg) brightness(95%) contrast(91%)',
          }}
          aria-hidden="true"
          className="pointer-events-none"
        />
        {eventCount > 0 && (
          <span
            className={cn(
              'absolute -top-1 -right-1',
              'h-4 min-w-4 px-0.5',
              'inline-flex items-center justify-center',
              'rounded-full bg-destructive text-foreground',
              'text-[10px] font-medium leading-none'
            )}
          >
            {eventCount > 99 ? '99+' : eventCount}
          </span>
        )}
      </Button>
    </div>
  )
}
