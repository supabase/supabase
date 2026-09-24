import { ChevronDown, LucideIcon } from 'lucide-react'
import { ReactNode } from 'react'
import { cn, Collapsible, CollapsibleContent, CollapsibleTrigger } from 'ui'

type IconComponent =
  | LucideIcon
  | React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>

interface DetailSectionHeaderProps {
  title: string
  icon?: IconComponent
  summary?: ReactNode
  className?: string
}

export const DetailSectionHeader = ({
  title,
  icon: Icon,
  summary,
  className,
}: DetailSectionHeaderProps) => (
  <div className={cn('relative flex h-9 items-center justify-between gap-3 px-4', className)}>
    <div className="flex min-w-0 items-center gap-2">
      {Icon ? (
        <Icon size={14} strokeWidth={1.5} className="shrink-0 text-foreground-lighter" />
      ) : (
        <span className="w-3.5 shrink-0" aria-hidden />
      )}
      <span className="truncate heading-default text-foreground">{title}</span>
    </div>
    {summary !== undefined && summary !== null && summary !== '' ? (
      <span className="truncate text-right font-mono text-xs text-foreground">{summary}</span>
    ) : null}
  </div>
)

interface CollapsibleDetailSectionProps {
  title: string
  icon?: IconComponent
  summary?: ReactNode
  defaultOpen?: boolean
  className?: string
  children: ReactNode
}

/** A titled group of detail rows that can be collapsed. */
export const CollapsibleDetailSection = ({
  title,
  icon,
  summary,
  defaultOpen = true,
  className,
  children,
}: CollapsibleDetailSectionProps) => (
  <Collapsible defaultOpen={defaultOpen} className={cn('border-b', className)}>
    <CollapsibleTrigger className="w-full flex items-center justify-between pr-4 [&[data-state=open]>svg]:-rotate-180! transition hover:bg-surface-100">
      <DetailSectionHeader title={title} icon={icon} summary={summary} className="min-w-0 flex-1" />
      <ChevronDown className="transition-transform duration-200" strokeWidth={1.5} size={14} />
    </CollapsibleTrigger>
    <CollapsibleContent>{children}</CollapsibleContent>
  </Collapsible>
)
