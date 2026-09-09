'use client'

import { Tabs as TabsPrimitive } from 'radix-ui'
import * as React from 'react'

import { cn } from '../../../lib/utils/cn'
import { useTabIndicator } from './useTabIndicator'

const Tabs = TabsPrimitive.Root

export interface TabsListProps extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.List> {
  indicatorClassName?: string
}

const TabsList = React.forwardRef<React.ElementRef<typeof TabsPrimitive.List>, TabsListProps>(
  ({ className, indicatorClassName, children, ...props }, ref) => {
    const listRef = React.useRef<HTMLDivElement>(null)
    useTabIndicator(listRef)

    return (
      <TabsPrimitive.List
        ref={(node) => {
          listRef.current = node
          if (typeof ref === 'function') ref(node)
          else if (ref) ref.current = node
        }}
        className={cn(
          'group/list relative flex items-center border-b border-transparent',
          'shadow-[inset_0_-1px_0_0_var(--tab-track,var(--border-default))]',
          className
        )}
        {...props}
      >
        {children}
        <TabsIndicator className={indicatorClassName} />
      </TabsPrimitive.List>
    )
  }
)
TabsList.displayName = TabsPrimitive.List.displayName

const TabsIndicator = React.forwardRef<HTMLSpanElement, React.ComponentPropsWithoutRef<'span'>>(
  ({ className, ...props }, ref) => (
    <span
      ref={ref}
      aria-hidden
      data-tab-indicator
      className={cn(
        'pointer-events-none absolute bottom-0 left-0 h-px bg-foreground',
        'w-[var(--active-tab-width,0)] translate-x-[var(--active-tab-left,0)]',
        'transition-none opacity-0',
        'group-data-[tab-indicator-ready]/list:opacity-100',
        'group-data-[tab-indicator-ready]/list:transition-[translate,width]',
        'group-data-[tab-indicator-ready]/list:duration-[250ms]',
        'group-data-[tab-indicator-ready]/list:ease-move',
        'motion-reduce:transition-none',
        className
      )}
      {...props}
    />
  )
)
TabsIndicator.displayName = 'TabsIndicator'

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      'inline-flex cursor-pointer items-center justify-center whitespace-nowrap py-1.5 text-sm transition-colors focus-ring disabled:pointer-events-none disabled:opacity-50 data-[state=active]:text-foreground data-[state=active]:shadow-xs text-foreground-lighter hover:text-foreground',
      'group',
      className
    )}
    {...props}
  />
))
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content ref={ref} className={cn('mt-4 focus-ring', className)} {...props} />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsContent, TabsIndicator, TabsList, TabsTrigger }
