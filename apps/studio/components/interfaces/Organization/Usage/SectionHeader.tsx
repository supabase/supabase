import type { ReactNode } from 'react'
import { cn } from 'ui'

export interface SectionHeaderProps {
  title: string
  description: string
  className?: string
  children?: ReactNode
}

const SectionHeader = ({ title, description, className, children }: SectionHeaderProps) => {
  return (
    <div className={cn('mx-auto flex flex-col gap-10 py-14', className)}>
      <div>
        <p className="text-xl">{title}</p>
        <p className="text-sm text-foreground-light">{description}</p>
        {children}
      </div>
    </div>
  )
}

export default SectionHeader
