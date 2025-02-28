'use client'
import * as CollapsiblePrimitive from '@radix-ui/react-collapsible'
import { forwardRef, useEffect, useState } from 'react'
import { cn } from 'ui'

const Collapsible = CollapsiblePrimitive.Root

const CollapsibleTrigger = CollapsiblePrimitive.CollapsibleTrigger

const CollapsibleContent = forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof CollapsiblePrimitive.CollapsibleContent>
>(({ children, ...props }, ref) => {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <CollapsiblePrimitive.CollapsibleContent
      ref={ref}
      {...props}
      className={cn(
        'overflow-hidden',
        mounted &&
          'data-[state=closed]:animate-fd-collapsible-up data-[state=open]:animate-fd-collapsible-down',
        props.className
      )}
    >
      {children}
    </CollapsiblePrimitive.CollapsibleContent>
  )
})

CollapsibleContent.displayName = CollapsiblePrimitive.CollapsibleContent.displayName

export { Collapsible, CollapsibleTrigger, CollapsibleContent }
