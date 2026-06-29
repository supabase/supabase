'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { cn } from 'ui'

// Duplicated for tree-shaking — bundler must see literal process.env reference.
// Keep in sync: index.ts, DevToolbarContext.tsx, DevToolbar.tsx, DevToolbarTrigger.tsx
const env = process.env.NEXT_PUBLIC_ENVIRONMENT
const IS_TOOLBAR_ENABLED = env === 'local' || env === 'staging'

export function DevToolsDock({ children, className }: { children: ReactNode; className?: string }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!IS_TOOLBAR_ENABLED || !mounted) return null

  return createPortal(
    <div
      className={cn(
        'pointer-events-none fixed inset-x-0 bottom-0 z-50 flex items-end justify-end gap-2',
        'p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pr-[max(1.5rem,env(safe-area-inset-right))]',
        className
      )}
    >
      <div className="pointer-events-auto flex items-center justify-end gap-2">{children}</div>
    </div>,
    document.body
  )
}
