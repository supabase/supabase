import { ReactNode } from 'react'
import { cn } from 'ui'

export interface SectionHeaderProps {
  title: string
  description: string
  className?: string
  /** Optional right-aligned actions rendered on the title row */
  actions?: ReactNode
}

const SectionHeader = ({ title, description, className, actions }: SectionHeaderProps) => {
  return (
    <div className={cn('mx-auto flex flex-col gap-10 py-14', className)}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xl">{title}</p>
          <p className="text-sm text-foreground-light">{description}</p>
        </div>
        {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
      </div>
    </div>
  )
}

export default SectionHeader
