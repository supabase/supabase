import { noop } from 'lodash'
import Link from 'next/link'
import { AnchorHTMLAttributes, forwardRef } from 'react'
import { cn } from 'ui'

import type { Route } from 'components/ui/ui.types'
import { useAppStateSnapshot } from 'state/app-state'

interface NavigationIconButtonProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  route: Route
  isActive?: boolean
}

const NavigationIconLink = forwardRef<HTMLAnchorElement, NavigationIconButtonProps>(
  ({ route, isActive = false, onClick = noop, ...props }, ref) => {
    const snap = useAppStateSnapshot()

    const iconClasses = [
      'absolute left-0 top-0 flex rounded items-center h-10 w-10 items-center justify-center', // Layout
    ]

    const classes = [
      'relative',
      'h-10 w-10 group-data-[state=expanded]:w-full',
      'transition-all duration-200',
      'flex items-center rounded',
      'group-data-[state=collapsed]:justify-center',
      'group-data-[state=expanded]:-space-x-2',
      'text-foreground-lighter hover:text-foreground ',
      'hover:bg-surface-200',
      `${isActive ? '!bg-selection !text-foreground shadow-sm' : ''}`,
      'group/item',
    ]

    return route.link !== undefined ? (
      <Link
        role="button"
        aria-current={isActive}
        ref={ref}
        href={route.link!}
        {...props}
        onClick={onClick}
        className={cn(classes, props.className)}
      >
        <span id="icon-link" className={cn(...iconClasses)} {...props}>
          {route.icon}
        </span>
        <span
          aria-hidden={snap.navigationPanelOpen || undefined}
          className={cn(
            'min-w-[128px] text-sm text-foreground-light',
            'group-hover/item:text-foreground',
            'group-aria-current/item:text-foreground',
            'absolute left-7 group-data-[state=expanded]:left-12',
            'opacity-0 group-data-[state=expanded]:opacity-100',
            'transition-all'
          )}
        >
          {route.label}
        </span>
      </Link>
    ) : (
      <span ref={ref} {...props}></span>
    )
  }
)

NavigationIconLink.displayName = 'NavigationIconLink'
export default NavigationIconLink
