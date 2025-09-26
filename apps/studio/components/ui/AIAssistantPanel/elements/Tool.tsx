import type { PropsWithChildren } from 'react'

import {
  cn,
  Collapsible,
  CollapsibleContent_Shadcn_ as CollapsibleContent,
  CollapsibleTrigger_Shadcn_ as CollapsibleTrigger,
} from 'ui'

type ToolProps = PropsWithChildren<{
  className?: string
  label: string | JSX.Element
  icon?: JSX.Element
}>

export function Tool({ className, label, icon, children }: ToolProps) {
  const isCollapsible = !!children

  return (
    <div
      className={cn(
        'tool-item text-foreground-lighter flex items-center gap-2 py-2',
        '[&:not(.tool-item+.tool-item)]:mt-4 [&:not(:has(+.tool-item))]:mb-4',
        '[&:has(+.tool-item)]:border-b [&:has(+.tool-item)]:border-b-muted',
        'first:!mt-0 last:mb-0',
        className
      )}
    >
      <Collapsible>
        <CollapsibleTrigger
          className={cn('flex items-center gap-2 w-full text-left')}
          disabled={!children}
        >
          {icon}
          {typeof label === 'string' ? (
            <span className="text-foreground-lighter">{label}</span>
          ) : (
            label
          )}
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
