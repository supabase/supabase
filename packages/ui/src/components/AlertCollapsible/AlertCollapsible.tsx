'use client'

import { type VariantProps } from 'class-variance-authority'
import { ChevronDown } from 'lucide-react'
import * as React from 'react'

import { cn } from '../../lib/utils/cn'
import { Button } from '../Button'
import { alertVariants } from '../shadcn/ui/alert'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../shadcn/ui/collapsible'

export interface AlertCollapsibleProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'>,
    VariantProps<typeof alertVariants> {
  trigger: React.ReactNode
  defaultOpen?: boolean
}

const AlertCollapsible = React.forwardRef<HTMLDivElement, AlertCollapsibleProps>(
  ({ className, variant = 'default', trigger, defaultOpen, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        alertVariants({ variant }),
        // Override default padding to be tighter
        'p-3',
        className
      )}
      {...props}
    >
      <Collapsible defaultOpen={defaultOpen}>
        <div className="flex items-center justify-between gap-2">
          <span className="font-medium">{trigger}</span>
          <CollapsibleTrigger asChild>
            <Button
              type="outline"
              size="tiny"
              className={cn('!px-0 w-[26px]', '[&[data-state=open]_svg]:rotate-180')}
              aria-label="Toggle"
              icon={<ChevronDown className="transition-transform duration-200" />}
            />
          </CollapsibleTrigger>
        </div>
        <CollapsibleContent className="pt-3">{children}</CollapsibleContent>
      </Collapsible>
    </div>
  )
)
AlertCollapsible.displayName = 'AlertCollapsible'

export { AlertCollapsible }
