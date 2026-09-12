'use client'

import { Tabs as TabsPrimitive } from 'radix-ui'
import { useRef, type ComponentPropsWithRef } from 'react'

import { cn } from '../../../lib/utils/cn'
import { useTabIndicator } from './useTabIndicator'

const Tabs = TabsPrimitive.Root

const TabsList = ({
  className,
  children,
  ref,
  ...props
}: ComponentPropsWithRef<typeof TabsPrimitive.List>) => {
  const listRef = useRef<HTMLDivElement>(null)
  useTabIndicator(listRef)

  return (
    <TabsPrimitive.List
      ref={(node) => {
        listRef.current = node
        if (typeof ref === 'function') ref(node)
        else if (ref) ref.current = node
      }}
      className={cn(
        'group/list relative flex items-center border-b',
        'has-[[data-tab-indicator]]:border-b-0',
        'has-[[data-tab-indicator]]:after:absolute',
        'has-[[data-tab-indicator]]:after:left-[var(--tab-track-inset,0px)]',
        'has-[[data-tab-indicator]]:after:right-0',
        'has-[[data-tab-indicator]]:after:bottom-0 has-[[data-tab-indicator]]:after:h-px',
        'has-[[data-tab-indicator]]:after:bg-[var(--tab-track,var(--border-default))]',
        'has-[[data-tab-indicator]]:after:pointer-events-none',
        className
      )}
      {...props}
    >
      {children}
    </TabsPrimitive.List>
  )
}

const TabsIndicator = ({ className, ...props }: ComponentPropsWithRef<'span'>) => (
  <span
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

const TabsTrigger = ({
  className,
  ...props
}: ComponentPropsWithRef<typeof TabsPrimitive.Trigger>) => (
  <TabsPrimitive.Trigger
    className={cn(
      'inline-flex cursor-pointer items-center justify-center whitespace-nowrap py-1.5 text-sm transition-colors disabled:pointer-events-none disabled:opacity-50 data-[state=active]:text-foreground data-[state=active]:shadow-xs text-foreground-lighter hover:text-foreground',
      'focus-inset',
      'border-b-2 border-b-transparent data-[state=active]:border-b-foreground',
      'group-has-[[data-tab-indicator]]/list:border-b-0',
      'group',
      className
    )}
    {...props}
  />
)

const TabsContent = ({
  className,
  ...props
}: ComponentPropsWithRef<typeof TabsPrimitive.Content>) => (
  <TabsPrimitive.Content className={cn('mt-4 focus-ring', className)} {...props} />
)

export { Tabs, TabsContent, TabsIndicator, TabsList, TabsTrigger }
