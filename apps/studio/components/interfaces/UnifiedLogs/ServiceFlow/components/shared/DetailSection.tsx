import { LucideIcon } from 'lucide-react'
import { ReactNode } from 'react'
import { cn } from 'ui'

type IconComponent = LucideIcon | React.ComponentType<{ size?: number; className?: string }>

interface DetailSectionHeaderProps {
  title: string
  icon?: IconComponent
  summary?: ReactNode
  className?: string
  topDivider?: boolean
}

export const DetailSectionHeader = ({
  title,
  icon: Icon,
  summary,
  className,
  topDivider,
}: DetailSectionHeaderProps) => (
  <div className={cn('relative flex h-9 items-center justify-between gap-3 px-4', className)}>
    {topDivider && (
      <span className="absolute inset-x-4 top-0 border-t border-dashed border-border-strong" />
    )}
    <div className="flex min-w-0 items-center gap-2">
      {Icon ? (
        <Icon size={14} className="shrink-0 text-foreground-lighter" />
      ) : (
        <span className="w-3.5 shrink-0" aria-hidden />
      )}
      <span className="truncate text-xs uppercase tracking-wider text-foreground-light font-mono">
        {title}
      </span>
    </div>
    {summary !== undefined && summary !== null && summary !== '' ? (
      <span className="truncate text-right font-mono text-xs text-foreground">{summary}</span>
    ) : null}
  </div>
)
