'use client'

import type { HTMLAttributes, ReactNode, Ref, RefObject } from 'react'
import { cn } from 'ui'

import { MobileNavLock } from './MobileNavLock'

export interface MobileNavDrawerProps extends HTMLAttributes<HTMLDivElement> {
  open: boolean
  footer?: ReactNode
  // the button that opens and closes the drawer, so the open drawer can lock the page
  toggleRef: RefObject<HTMLElement | null>
  ref?: Ref<HTMLDivElement>
}

export const MobileNavDrawer = ({
  open,
  footer,
  toggleRef,
  className,
  children,
  ...props
}: MobileNavDrawerProps) => (
  <div
    className={cn(
      'fixed inset-x-0 top-(--header-height) z-50 flex h-[calc(100dvh-var(--header-height))] flex-col bg-background',
      !open && 'hidden',
      className
    )}
    {...props}
  >
    {open ? <MobileNavLock toggleRef={toggleRef} /> : null}
    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-6">{children}</div>
    {footer ? <div className="shrink-0 border-t px-6 py-4">{footer}</div> : null}
  </div>
)
