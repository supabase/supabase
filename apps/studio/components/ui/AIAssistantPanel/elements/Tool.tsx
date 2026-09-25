import type { PropsWithChildren, ReactNode } from 'react'
import { cn, Collapsible, CollapsibleContent, CollapsibleTrigger } from 'ui'

type ToolProps = PropsWithChildren<{
  className?: string
  label: ReactNode
  icon?: ReactNode
  /** Shimmers the label to mark the tool call that is currently in progress. */
  isActive?: boolean
}>

export function Tool({ className, label, icon, isActive = false, children }: ToolProps) {
  const isCollapsible = !!children

  return (
    <div
      className={cn(
        'tool-item w-full max-w-3xl mx-auto text-foreground-lighter flex items-center gap-2 py-2',
        '[&:not(.tool-item+.tool-item)]:mt-4 [&:not(:has(+.tool-item))]:mb-4',
        '[&:has(+.tool-item)]:border-b [&:has(+.tool-item)]:border-b-muted',
        'first:mt-0! last:mb-0',
        className
      )}
    >
      <Collapsible>
        <CollapsibleTrigger
          className={cn('flex items-center gap-2 w-full text-left')}
          disabled={!children}
        >
          {icon}
          <span className={cn('text-foreground-lighter', isActive && 'shimmer')}>{label}</span>
        </CollapsibleTrigger>

        {isCollapsible && (
          <CollapsibleContent
            className={cn('pl-6 py-2 text-xs leading-normal', 'max-h-64 overflow-y-auto')}
          >
            {children}
          </CollapsibleContent>
        )}
      </Collapsible>
    </div>
  )
}

Tool.displayName = 'Tool'
