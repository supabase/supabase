import { forwardRef, HTMLAttributes, PropsWithChildren } from 'react'

import { cn } from '../../lib/utils/cn'

interface NavMenuProps extends HTMLAttributes<HTMLDivElement> {}

export const NavMenu = forwardRef<HTMLDivElement, NavMenuProps>(
  (
    props: PropsWithChildren<{
      className?: string
    }>,
    forwardedRef
  ) => {
    return (
      <nav ref={forwardedRef} dir="ltr" {...props} className={cn('border-b', props.className)}>
        <ul role="menu" className="flex gap-5">
          {props.children}
        </ul>
      </nav>
    )
  }
)

interface NavMenuItemProps
  extends PropsWithChildren<{
    className?: string
    active: boolean
  }> {}

export const NavMenuItem = forwardRef<HTMLLIElement, NavMenuItemProps>(
  ({ children, className, active, ...props }, ref) => (
    <li
      ref={ref}
      aria-selected={active ? 'true' : 'false'}
      data-state={active ? 'active' : 'inactive'}
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap text-sm ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:text-foreground text-foreground-lighter hover:text-foreground data-[state=active]:border-foreground border-b-2 border-transparent *:py-1.5',
        className
      )}
      {...props}
    >
      {children}
    </li>
  )
)
