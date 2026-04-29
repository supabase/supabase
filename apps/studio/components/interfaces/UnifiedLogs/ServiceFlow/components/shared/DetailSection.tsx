import { ChevronDown, ChevronRight } from 'lucide-react'
import { ReactNode, useState } from 'react'
import {
  cn,
  Collapsible_Shadcn_ as Collapsible,
  CollapsibleContent_Shadcn_ as CollapsibleContent,
  CollapsibleTrigger_Shadcn_ as CollapsibleTrigger,
} from 'ui'

interface DetailSectionProps {
  title: string
  summary?: ReactNode
  defaultOpen?: boolean
  collapsible?: boolean
  children?: ReactNode
}

export const DetailSection = ({
  title,
  summary,
  defaultOpen = true,
  collapsible = true,
  children,
}: DetailSectionProps) => {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const hasChildren = !!children

  const HeaderInner = (
    <div className="flex h-9 items-center justify-between gap-3 px-4">
      <div className="flex min-w-0 items-center gap-2">
        {collapsible && hasChildren ? (
          isOpen ? (
            <ChevronDown size={12} className="shrink-0 text-foreground-lighter" />
          ) : (
            <ChevronRight size={12} className="shrink-0 text-foreground-lighter" />
          )
        ) : (
          <span className="w-3 shrink-0" aria-hidden />
        )}
        <span className="truncate text-xs font-medium uppercase tracking-wider text-foreground-light">
          {title}
        </span>
      </div>
      {summary !== undefined && summary !== null && summary !== '' ? (
        <span className="truncate text-right font-mono text-sm text-foreground">{summary}</span>
      ) : null}
    </div>
  )

  if (!collapsible || !hasChildren) {
    return <div className="border-b border-border">{HeaderInner}</div>
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="border-b border-border">
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className={cn(
            'w-full text-left transition-colors hover:bg-surface-200/50',
            isOpen && 'bg-surface-100/40'
          )}
        >
          {HeaderInner}
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
        <div className="pb-1">{children}</div>
      </CollapsibleContent>
    </Collapsible>
  )
}
