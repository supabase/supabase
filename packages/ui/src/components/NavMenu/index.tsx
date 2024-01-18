import { cn } from '@ui/lib/utils'
import { HTMLAttributes, PropsWithChildren, forwardRef } from 'react'

interface NavMenuProps extends HTMLAttributes<HTMLDivElement> {}

export const NavMenu = forwardRef<HTMLDivElement, NavMenuProps>(
  (
    props: PropsWithChildren<{
      className?: string
    }>
  ) => {
    return (
      <nav dir="ltr" role="menu" {...props} className={cn('flex border-b', props.className)}>
        <ul role="menu">{props.children}</ul>
      </nav>
    )
  }
)

export const NavMenuItem = ({
  children,
  className,
  ...props
}: PropsWithChildren<{
  className?: string
  active: boolean
}>) => (
  <li
    role="menuitem"
    aria-selected={props.active}
    data-state={props.active ? 'active' : 'inactive'}
    className={cn(
      'inline-flex items-center justify-center whitespace-nowrap text-sm ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm text-foreground-lighter hover:text-foreground data-[state=active]:border-foreground border-b-2 border-transparent *:px-3 *:py-1.5',
      className
    )}
    {...props}
  >
    {children}
  </li>
)
