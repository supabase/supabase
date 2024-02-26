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
    const classes = [
      'transition-colors duration-200',
      'flex items-center justify-center h-10 w-10 rounded', // Layout
      'text-foreground-lighter hover:text-foreground ', // Dark mode
      'bg-studio hover:bg-surface-200', // Light mode
      `${isActive ? '!bg-surface-300 !text-foreground shadow-sm' : ''}`,
    ]
    return (
      <Tooltip_Shadcn_ delayDuration={0}>
        <TooltipTrigger_Shadcn_ asChild>
          {route.link !== undefined ? (
            <Link
              ref={ref}
              href={route.link!}
              {...props}
              className={cn(...classes, props.className)}
            >
              <span className={cn(...classes, props.className)} {...props}>
                {route.icon}
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
