import { LucideIcon } from 'lucide-react'
import { ReactNode } from 'react'

type IconComponent = LucideIcon | React.ComponentType<{ size?: number; className?: string }>

interface DetailSectionHeaderProps {
  title: string
  icon?: IconComponent
  summary?: ReactNode
}

export const DetailSectionHeader = ({ title, icon: Icon, summary }: DetailSectionHeaderProps) => (
  <div className="flex h-9 items-center justify-between gap-3 px-4">
    <div className="flex min-w-0 items-center gap-2">
      {Icon ? (
        <Icon size={14} className="shrink-0 text-foreground-lighter" />
      ) : (
        <span className="w-3.5 shrink-0" aria-hidden />
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
