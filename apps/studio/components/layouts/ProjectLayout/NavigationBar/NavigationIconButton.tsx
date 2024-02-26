import Link from 'next/link'
import React, { forwardRef } from 'react'

import ConditionalWrap from 'components/ui/ConditionalWrap'
import { Route } from 'components/ui/ui.types'
import { TooltipContent_Shadcn_, TooltipTrigger_Shadcn_, Tooltip_Shadcn_, cn } from 'ui'

interface NavigationIconButtonProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  route: Route
  isActive?: boolean
}

const NavigationIconButton = forwardRef<HTMLAnchorElement, NavigationIconButtonProps>(
  ({ route, isActive = false, ...props }, ref) => {
    const iconClasses = [
      'absolute left-0 top-0 flex rounded items-center h-10 w-10 items-center justify-center', // Layout
    ]

    const classes = [
      'relative',
      'h-10 w-10 group-data-[state=expanded]:h-10 group-data-[state=expanded]:w-full', // Size
      'transition-all duration-[4000ms]',

      'flex items-center rounded', // Layout

      'group-data-[state=collapsed]:justify-center',
      'group-data-[state=expanded]:gap-0',
      // 'group-data-[state=expanded]:px-3',

      'text-foreground-lighter hover:text-foreground ', // Dark mode
      'bg-studio hover:bg-surface-200', // Light mode
      `${isActive ? '!bg-surface-300 !text-foreground shadow-sm' : ''}`,
      'group/item',
    ]
    return (
      <Tooltip_Shadcn_ delayDuration={0}>
        <TooltipTrigger_Shadcn_ asChild>
          {route.link !== undefined ? (
            <Link
              ref={ref}
              href={route.link!}
              {...props}
              className={cn(classes, props.className)}
              aria-selected={isActive}
            >
              <span className={cn(...iconClasses)} {...props}>
                {route.icon}
              </span>
              <span
                // aria-hidden="true"
                className={cn(
                  'absolute',
                  'left-8',
                  'group-data-[state=expanded]:left-12',
                  'min-w-[128px]',
                  'text-sm text-foreground-light',
                  'group-hover/item:text-foreground',
                  'opacity-0 group-data-[state=expanded]:opacity-100',
                  'transition-all',
                  'group-aria-selected/item:text-foreground',
                  'delay-100'
                )}
              >
                {route.label}
              </span>
            </Link>
          ) : (
            <span ref={ref} {...props}></span>
          )}
        </TooltipTrigger_Shadcn_>
        <TooltipContent_Shadcn_ side="right" align="center">
          {route.label}
        </TooltipContent_Shadcn_>
      </Tooltip_Shadcn_>
    )
  }
)

NavigationIconButton.displayName = 'NavigationIconButton'

export default NavigationIconButton
