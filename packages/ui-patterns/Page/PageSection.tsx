import React from 'react'
import { cn } from 'ui'

interface PageSectionProps {
  children?: React.ReactNode
  title?: string
  subtitle?: string
  actions?: React.ReactNode
  className?: string
}

export function PageSection({ children, title, subtitle, actions, className }: PageSectionProps) {
  return (
    <section className={cn('pt-12', className)}>
      {(title || subtitle || actions) && (
        <div className="flex items-end justify-between gap-4 mb-6">
          <div className="space-y-1">
            {title && <h2 className="text-lg text-foreground">{title}</h2>}
            {subtitle && <p className="text-sm text-foreground-light">{subtitle}</p>}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      {children}
    </section>
  )
}

export type { PageSectionProps }
