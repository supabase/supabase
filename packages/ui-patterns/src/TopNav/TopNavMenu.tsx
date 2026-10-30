'use client'

import { useRef, type ComponentProps, type ElementType, type ReactNode } from 'react'
import {
  cn,
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  NavigationMenuViewport,
} from 'ui'

export interface TopNavMenuProps {
  children: ReactNode
  className?: string
}

export interface TopNavMenuItemProps extends Omit<ComponentProps<'button'>, 'children'> {
  label: ReactNode
  children: ReactNode
}

export interface TopNavMenuLinkProps extends ComponentProps<'a'> {
  linkAs?: ElementType
}

export interface TopNavMenuPanelProps extends ComponentProps<'div'> {
  aside?: ReactNode
}

export interface TopNavMenuGroupProps {
  label?: ReactNode
  children: ReactNode
  className?: string
}

// the panel spans the closest positioned parent and its closed edge draws the bar's bottom line,
// so render the menu inside a `relative` bar with no bottom border of its own on desktop
export const TopNavMenu = ({ children, className }: TopNavMenuProps) => {
  const rootRef = useRef<HTMLElement>(null)

  // the panel is as wide as the bar, so its columns start under the first item's text
  const handleValueChange = (value: string) => {
    const root = rootRef.current
    const bar = root?.offsetParent
    const trigger = root?.querySelector('li > *')
    if (!value || !root || !bar || !trigger) return
    const inset =
      trigger.getBoundingClientRect().left -
      bar.getBoundingClientRect().left +
      parseFloat(getComputedStyle(trigger).paddingLeft)
    root.style.setProperty('--top-nav-menu-inset', `${inset}px`)
  }

  return (
    <NavigationMenu
      ref={rootRef}
      delayDuration={80}
      skipDelayDuration={300}
      renderViewport={false}
      onValueChange={handleValueChange}
      className={cn('static h-full items-stretch', className)}
    >
      <NavigationMenuList className="h-full items-stretch space-x-0">{children}</NavigationMenuList>
      <NavigationMenuViewport
        forceMount
        containerProps={{ className: 'inset-x-0' }}
        className={cn(
          'mt-0 w-full rounded-none border-0 border-b border-default bg-background shadow-none md:w-full',
          'h-[calc(var(--radix-navigation-menu-viewport-height,0px)+1px)] data-[state=closed]:h-0',
          'data-[state=open]:animate-none! data-[state=closed]:animate-none!',
          'motion-safe:transition-[height] motion-safe:duration-200 motion-safe:ease-[cubic-bezier(0.23,1,0.32,1)]',
          'data-[state=closed]:duration-300 data-[state=closed]:ease-[cubic-bezier(0.32,0.72,0,1)]'
        )}
      />
    </NavigationMenu>
  )
}

export const TopNavMenuItem = ({ label, children, className, ...props }: TopNavMenuItemProps) => (
  <NavigationMenuItem className="text-[0.8125rem] font-medium">
    <NavigationMenuTrigger
      className={cn(
        'inline-flex h-full items-center px-3.5 text-foreground-light transition-colors',
        'hover:text-foreground data-open:text-foreground focus-ring focus-visible:text-foreground',
        'aria-[current=true]:text-foreground',
        className
      )}
      {...props}
    >
      {label}
    </NavigationMenuTrigger>
    <NavigationMenuContent
      className={cn(
        'md:w-full duration-150 ease-out data-[state=closed]:duration-250 motion-reduce:animate-none!',
        'data-[state=open]:animate-in data-[state=open]:fade-in',
        'data-[state=closed]:animate-out data-[state=closed]:fade-out',
        'data-[motion^=from-]:animate-in',
        'data-[motion^=to-]:duration-75 data-[motion^=to-]:ease-out'
      )}
    >
      {children}
    </NavigationMenuContent>
  </NavigationMenuItem>
)

export const TopNavMenuLink = ({
  linkAs: Link = 'a',
  className,
  ...props
}: TopNavMenuLinkProps) => (
  <NavigationMenuItem className="text-[0.8125rem] font-medium">
    <NavigationMenuLink asChild>
      <Link
        className={cn(
          'inline-flex h-full items-center px-3.5 text-foreground-light transition-colors',
          'hover:text-foreground focus-ring focus-visible:text-foreground',
          'aria-[current=true]:text-foreground',
          className
        )}
        {...props}
      />
    </NavigationMenuLink>
  </NavigationMenuItem>
)

export const TopNavMenuPanel = ({ aside, className, children, ...props }: TopNavMenuPanelProps) => (
  <div
    className={cn(
      'max-h-[calc(100dvh-var(--header-height)-6rem)]',
      'overflow-y-auto overscroll-contain pt-6 pb-2 pr-6 pl-(--top-nav-menu-inset)',
      aside ? 'flex gap-x-14' : 'grid grid-cols-[repeat(auto-fill,15rem)] gap-x-7',
      className
    )}
    {...props}
  >
    {aside ? (
      <>
        <div className="grid min-w-0 grid-flow-col grid-rows-[auto_auto] auto-cols-[minmax(0,15rem)] gap-x-7">
          {children}
        </div>
        <aside className="mb-10 grid min-w-72 flex-1 content-start gap-4">{aside}</aside>
      </>
    ) : (
      children
    )}
  </div>
)

export const TopNavMenuGroup = ({ label, children, className }: TopNavMenuGroupProps) => (
  <section className={cn('row-span-2 mb-10 grid grid-rows-subgrid', className)}>
    {label ? (
      <h2 className="pb-2 font-mono text-xs uppercase tracking-widest text-foreground-lighter">
        {label}
      </h2>
    ) : null}
    <ul className="row-start-2 flex flex-col">{children}</ul>
  </section>
)

export const TopNavMenuGroupLink = ({
  linkAs: Link = 'a',
  className,
  ...props
}: TopNavMenuLinkProps) => (
  <li>
    <NavigationMenuLink asChild>
      <Link
        className={cn(
          '-mx-2 flex items-center gap-2 rounded-md px-2 py-2 text-[0.9375rem] text-foreground',
          'hover:bg-surface-200 focus-ring',
          className
        )}
        {...props}
      />
    </NavigationMenuLink>
  </li>
)
