import { cn } from '@ui/lib/utils'
import { PropsWithChildren } from 'react'

export const NavigationTabs = ({
  children,
  className,
}: PropsWithChildren<{
  className?: string
}>) => {
  return (
    <nav aria-label="Navigation tabs" dir="ltr" className={cn('flex border-b', className)}>
      <ul role="tablist">{children}</ul>
    </nav>
  )
}

export const NavigationTabsItem = ({
  children,
  className,
  ...props
}: PropsWithChildren<{
  className?: string
  active: boolean
}>) => (
  <li
    role="tab"
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
