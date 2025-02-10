import { ReactNode } from 'react'
import { cn } from 'ui'

interface PageHeaderProps {
  title: string
  subtitle?: string
  actions?: ReactNode
  className?: string
}

const PageHeader = ({ title, subtitle, actions, className }: PageHeaderProps) => {
  return (
    <div className={cn('flex flex-col gap-4', className)}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl text-foreground">{title}</h1>
          {subtitle && <p className="text-sm text-foreground-light">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  )
}

export default PageHeader
