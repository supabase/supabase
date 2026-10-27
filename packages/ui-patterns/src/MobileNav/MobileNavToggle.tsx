'use client'

import { Menu, X } from 'lucide-react'
import type { ButtonHTMLAttributes, Ref } from 'react'
import { buttonVariants, cn } from 'ui'

export interface MobileNavToggleProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  isOpen: boolean
  ref?: Ref<HTMLButtonElement>
}

export const MobileNavToggle = ({ isOpen, className, ref, ...props }: MobileNavToggleProps) => (
  <button
    ref={ref}
    type="button"
    tabIndex={0}
    aria-expanded={isOpen}
    className={cn(
      buttonVariants({ variant: 'default' }),
      'relative size-7.5 min-w-7.5 border-default bg-surface-100/75 px-0 text-foreground-light',
      "before:absolute before:-inset-y-2 before:left-0 before:-right-3 before:content-['']",
      className
    )}
    {...props}
  >
    <span className="sr-only">{isOpen ? 'Close main menu' : 'Open main menu'}</span>
    <Menu
      aria-hidden
      strokeWidth={1}
      className={cn(
        'absolute inset-0 m-auto size-4.5 transition duration-150 ease-out',
        isOpen && 'opacity-0 scale-75 motion-reduce:scale-100'
      )}
    />
    <X
      aria-hidden
      strokeWidth={1}
      className={cn(
        'absolute inset-0 m-auto size-4.5 transition duration-150 ease-out',
        !isOpen && 'opacity-0 scale-75 motion-reduce:scale-100'
      )}
    />
  </button>
)
