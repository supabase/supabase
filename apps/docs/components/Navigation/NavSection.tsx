import { ChevronDown } from 'lucide-react'
import type { HTMLAttributes } from 'react'
import { cn } from 'ui'

export const NavSectionCaret = ({ className }: { className?: string }) => (
  <ChevronDown
    width={16}
    className={cn('data-open-parent:rotate-0 data-closed-parent:-rotate-90 transition', className)}
  />
)

export const NavSectionList = ({ className, ...props }: HTMLAttributes<HTMLUListElement>) => (
  <ul className={cn('leading-5', className)} {...props} />
)

export const NavSectionContent = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'border-l border-muted pl-3 ml-1 mt-0.5',
      'overflow-hidden data-open:animate-slide-down data-closed:animate-slide-up motion-reduce:animate-none',
      className
    )}
    {...props}
  />
)
