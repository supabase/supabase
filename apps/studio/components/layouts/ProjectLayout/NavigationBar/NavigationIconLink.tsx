import { noop } from 'lodash'
import Link from 'next/link'
import {
  AnchorHTMLAttributes,
  cloneElement,
  ComponentPropsWithoutRef,
  forwardRef,
  isValidElement,
} from 'react'
import { cn, Tooltip, TooltipContent, TooltipTrigger } from 'ui'

import type { Route } from 'components/ui/ui.types'
import { useLocalStorageQuery } from 'hooks/misc/useLocalStorage'
import { LOCAL_STORAGE_KEYS } from 'lib/constants'
import { useAppStateSnapshot } from 'state/app-state'

interface NavigationIconButtonProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  route: Route
  isActive?: boolean
}

const NavigationIconLink = forwardRef<HTMLAnchorElement, NavigationIconButtonProps>(
  ({ route, isActive = false, onClick = noop, ...props }, ref) => {
    const snap = useAppStateSnapshot()

    const [storedAllowNavPanel] = useLocalStorageQuery(
      LOCAL_STORAGE_KEYS.EXPAND_NAVIGATION_PANEL,
      true
    )
    // Don't allow the nav panel to expand in playwright tests
    const allowNavPanelToExpand = process.env.NEXT_PUBLIC_NODE_ENV !== 'test' && storedAllowNavPanel

    const iconClasses = [
      'absolute left-0 top-0 flex rounded items-center h-10 w-10 items-center justify-center text-foreground-lighter', // Layout
      'group-hover/item:text-foreground-light',
      isActive && '!text-foreground',
      'transition-colors',
    ]

    const classes = [
      'relative',
      'h-10 w-full md:w-10 md:group-data-[state=expanded]:w-full',
      'transition-all duration-200',
      'flex items-center rounded',
      'group-data-[state=collapsed]:justify-center',
      'group-data-[state=expanded]:-space-x-2',
      'hover:bg-surface-200',
      'group/item',
      `${isActive && '!bg-selection shadow-sm'}`,
    ]

    const LinkComponent = forwardRef<HTMLAnchorElement, ComponentPropsWithoutRef<typeof Link>>(
      function LinkComponent(props, ref) {
        if (route.linkElement && isValidElement(route.linkElement)) {
          return cloneElement<any>(route.linkElement, { ...props, ref })
        }

        return <Link ref={ref} {...props} />
      }
    )

    const linkContent = (
      <LinkComponent
        role="button"
        aria-current={isActive}
        ref={ref}
        href={route.link || '#'} // Provide a fallback href
        {...props}
        onClick={(e) => {
          if (!route.link) {
            e.preventDefault() // Prevent navigation if there's no link
          }
          onClick(e)
        }}
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
            'absolute left-10 md:left-7 md:group-data-[state=expanded]:left-12',
            'opacity-100 md:opacity-0 md:group-data-[state=expanded]:opacity-100',
            `${isActive && 'text-foreground hover:text-foreground'}`,
            'transition-all'
          )}
        >
          {route.label}
        </span>
      </LinkComponent>
    )

    if (!allowNavPanelToExpand) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
          <TooltipContent side="right">
            <span>{route.label}</span>
          </TooltipContent>
        </Tooltip>
      )
    }

    return linkContent
  }
)

NavigationIconLink.displayName = 'NavigationIconLink'
export default NavigationIconLink
