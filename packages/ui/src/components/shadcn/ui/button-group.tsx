'use client'

import * as React from 'react'

import { cn } from '../../../lib/utils/cn'
import { Button, ButtonProps } from '../../Button/Button'

interface ButtonGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

interface ButtonGroupItemProps extends Omit<ButtonProps, 'variant'> {
  children: React.ReactNode
  icon?: React.ReactNode
  asChild?: boolean
}

const ButtonGroup = React.forwardRef<HTMLDivElement, ButtonGroupProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'flex flex-col items-stretch border border-control rounded-md overflow-hidden',
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
ButtonGroup.displayName = 'ButtonGroup'

const ButtonGroupItem = React.forwardRef<HTMLButtonElement, ButtonGroupItemProps>(
  ({ className, children, icon, asChild, ...props }, ref) => {
    return (
      <Button
        ref={ref}
        type="text"
        icon={icon}
        asChild={asChild}
        className={cn(
          'h-auto py-2 rounded-none justify-start border-0 border-b border-border last:border-b-0',
          className
        )}
        {...props}
      >
        {children}
      </Button>
    )
  }
)
ButtonGroupItem.displayName = 'ButtonGroupItem'

export { ButtonGroup, ButtonGroupItem, type ButtonGroupProps, type ButtonGroupItemProps }
