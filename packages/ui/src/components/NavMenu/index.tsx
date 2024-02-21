import { HTMLAttributes, PropsWithChildren, forwardRef } from 'react'
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
        <ul role="menu">{props.children}</ul>
      </nav>
    )
  }
)

export const NavMenuItem = ({
  children,
  className,
  active,
  ...props
}: PropsWithChildren<{
  className?: string
  active: boolean
}>) => (
  <li
    aria-selected={active ? 'true' : 'false'}
    data-state={active ? 'active' : 'inactive'}
    className={cn(
      'inline-flex items-center justify-center whitespace-nowrap text-sm ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground text-foreground-lighter hover:text-foreground data-[state=active]:border-foreground border-b-2 border-transparent *:px-3 *:py-1.5',
      className
    )}
    {...props}
  >
    {children}
  </li>
)
