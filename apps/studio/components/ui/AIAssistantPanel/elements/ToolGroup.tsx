import { ChevronRight } from 'lucide-react'
import type { PropsWithChildren, ReactNode } from 'react'
import { cn, Collapsible, CollapsibleContent, CollapsibleTrigger } from 'ui'

type ToolGroupProps = PropsWithChildren<{
  className?: string
  label: ReactNode
  /** Shimmers the label to show work is in progress. */
  isActive?: boolean
  open: boolean
  onOpenChange: (open: boolean) => void
}>

/** Folds a run of `Tool` rows behind a single summary row. */
export function ToolGroup({
  className,
  label,
  isActive = false,
  open,
  onOpenChange,
  children,
}: ToolGroupProps) {
  return (
    <Collapsible
      open={open}
      onOpenChange={onOpenChange}
      className={cn(
        'w-full max-w-3xl mx-auto my-4 first:mt-0 last:mb-0 text-foreground-lighter',
        className
      )}
    >
      <CollapsibleTrigger className="group/tool-group flex items-center gap-2 w-full py-2 text-left">
        <ChevronRight
          strokeWidth={1.5}
          size={12}
          className="shrink-0 transition-transform duration-200 ease-out group-data-[state=open]/tool-group:rotate-90"
        />
        <span className={cn('min-w-0 truncate', isActive && 'shimmer')}>{label}</span>
      </CollapsibleTrigger>
      <CollapsibleContent className="overflow-hidden data-open:animate-collapsible-down data-closed:animate-collapsible-up">
        <div className="ml-1.5 pl-4 border-l border-muted">{children}</div>
      </CollapsibleContent>
    </Collapsible>
  )
}
