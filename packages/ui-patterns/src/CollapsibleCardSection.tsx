import { ChevronRight } from 'lucide-react'
import type { PropsWithChildren, ReactNode } from 'react'
import { cn, Collapsible, CollapsibleContent, CollapsibleTrigger } from 'ui'

type CollapsibleCardSectionProps = PropsWithChildren<{
  title: string
  description?: ReactNode
  defaultOpen?: boolean
}>

export const CollapsibleCardSection = ({
  title,
  description,
  defaultOpen = false,
  children,
}: CollapsibleCardSectionProps) => (
  <Collapsible defaultOpen={defaultOpen}>
    <CollapsibleTrigger className="group/trigger font-mono uppercase tracking-widest text-xs flex items-center gap-1 text-foreground-lighter/75 hover:text-foreground-light transition data-open:text-foreground-light">
      {title}
      <ChevronRight
        size={16}
        strokeWidth={1}
        className="mr-2 group-data-open/trigger:rotate-90 group-hover/trigger:text-foreground-light transition"
      />
    </CollapsibleTrigger>
    <CollapsibleContent
      className={cn(
        '[overflow-y:clip] pt-2 data-closed:animate-collapsible-up data-open:animate-collapsible-down'
      )}
    >
      {description && <p className="text-xs text-foreground-lighter mb-6">{description}</p>}
      {children}
    </CollapsibleContent>
  </Collapsible>
)
