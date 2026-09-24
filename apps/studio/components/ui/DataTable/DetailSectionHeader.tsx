import { LucideIcon } from 'lucide-react'
import { ReactNode } from 'react'
import { cn } from 'ui'

export type IconComponent =
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
