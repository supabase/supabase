'use client'

import { Collapsible as CollapsiblePrimitive } from 'radix-ui'
import * as React from 'react'

import { getExplicitTabIndex } from '../../../lib/utils/getExplicitTabIndex'

const Collapsible = CollapsiblePrimitive.Root

const CollapsibleTrigger = React.forwardRef<
  React.ElementRef<typeof CollapsiblePrimitive.CollapsibleTrigger>,
  React.ComponentPropsWithoutRef<typeof CollapsiblePrimitive.CollapsibleTrigger>
>(({ disabled, tabIndex, ...props }, ref) => {
  const computedTabIndex = getExplicitTabIndex(tabIndex, disabled)

  return (
    <CollapsiblePrimitive.CollapsibleTrigger
      ref={ref}
      {...props}
      disabled={disabled}
      tabIndex={computedTabIndex}
    />
  )
})
CollapsibleTrigger.displayName = CollapsiblePrimitive.CollapsibleTrigger.displayName

const CollapsibleContent = CollapsiblePrimitive.CollapsibleContent

export { Collapsible, CollapsibleTrigger, CollapsibleContent }
