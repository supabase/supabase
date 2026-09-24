import { ChevronDown } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn, Collapsible, CollapsibleContent, CollapsibleTrigger } from 'ui'

import { DetailSectionHeader, type IconComponent } from './DetailSectionHeader'

interface CollapsibleDetailSectionProps {
  title: string
  icon?: IconComponent
  defaultOpen?: boolean
  alternateRowColors?: boolean
  className?: string
  children: ReactNode
}

export const CollapsibleDetailSection = ({
  title,
  icon,
  defaultOpen,
  alternateRowColors,
  className,
  children,
}: CollapsibleDetailSectionProps) => (
  <Collapsible defaultOpen={defaultOpen} className={className}>
    <CollapsibleTrigger className="w-full flex items-center justify-between pr-4 [&[data-state=open]>svg]:-rotate-180! transition hover:bg-surface-100">
      <DetailSectionHeader title={title} icon={icon} />
      <ChevronDown className="transition-transform duration-200" strokeWidth={1.5} size={14} />
    </CollapsibleTrigger>
    <CollapsibleContent
      className={cn(alternateRowColors && '[&>*:nth-child(odd)]:bg-surface-100/50')}
    >
      {children}
    </CollapsibleContent>
  </Collapsible>
)
