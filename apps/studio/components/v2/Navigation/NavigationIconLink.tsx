import { noop } from 'lodash'
import Link from 'next/link'
import { cloneElement, forwardRef, isValidElement } from 'react'
import { cn, Tooltip, TooltipContent, TooltipTrigger } from 'ui'

import type { Route } from 'components/ui/ui.types'
import { useLocalStorageQuery } from 'hooks/misc/useLocalStorage'
import { LOCAL_STORAGE_KEYS } from 'common'
import type { AnchorHTMLAttributes } from 'react'

interface NavigationIconButtonProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  route: Route
  isActive?: boolean
}

const NavigationIconLink = forwardRef<HTMLAnchorElement, NavigationIconButtonProps>(
  ({ route, isActive = false, onClick = noop, ...props }, ref) => {
    const [storedAllowNavPanel] = useLocalStorageQuery(
      LOCAL_STORAGE_KEYS.EXPAND_NAVIGATION_PANEL,
      true
    )
    // Don't allow the nav panel to expand in playwright tests
    const allowNavPanelToExpand = process.env.NEXT_PUBLIC_NODE_ENV !== 'test' && storedAllowNavPanel

    const iconClasses = [
      'absolute left-0 top-0 flex rounded h-10 w-10 items-center justify-center text-foreground-lighter', // Layout
      'group-hover/item:text-foreground-light',
      isActive ? '!text-foreground [&_svg]:stroke-[1.5]' : '[&_svg]:stroke-[1]',
      'transition-all',
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

    const sharedProps = {
      role: 'button' as const,
      'aria-current': isActive,
      ref,
      href: route.link || '#',
      ...props,
      onClick: (e: React.MouseEvent<HTMLAnchorElement>) => {
        if (!route.link) {
          e.preventDefault()
        }
        onClick(e)
      },
      className: cn(classes, props.className),
    }

    const linkContent = (
      <>
        {route.linkElement && isValidElement(route.linkElement) ? (
          cloneElement(route.linkElement, sharedProps, [
            <span key="icon" id="icon-link" className={cn(...iconClasses)} {...props}>
              {route.icon}
            </span>,
            <span
              key="label"
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
            </span>,
          ])
        ) : (
          <Link {...sharedProps}>
            <span id="icon-link" className={cn(...iconClasses)} {...props}>
              {route.icon}
            </span>
            <span
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
          </Link>
        )}
      </>
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
