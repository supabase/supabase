import React from 'react'
import { cn } from 'ui'

interface SectionHeaderProps {
  title?: string
  subtitle?: string
  actions?: React.ReactNode
  className?: string
}

const SectionHeader = ({ title, subtitle, actions, className }: SectionHeaderProps) => {
  return (
    <div className={cn('flex items-center justify-between gap-4 mt-8 mb-4', className)}>
      <div className="space-y-1">
        {title && <h3 className="text-foreground text-xl">{title}</h3>}
        {subtitle && <p className="text-sm text-foreground-light">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}

export default SectionHeader
