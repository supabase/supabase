import { ChevronDown } from 'lucide-react'
import type { ComponentProps, ReactNode } from 'react'
import { cn, Collapsible, CollapsibleContent, CollapsibleTrigger } from 'ui'

type DialogDisclosureTriggerProps = ComponentProps<typeof CollapsibleTrigger> & {
  icon?: ReactNode
}

export const DialogDisclosure: typeof Collapsible = Collapsible

export const DialogDisclosureTrigger = ({
  children,
  className,
  icon,
  ...props
}: DialogDisclosureTriggerProps) => (
  <CollapsibleTrigger
    className={cn(
      'group/trigger flex w-full cursor-pointer items-center justify-between gap-2 text-left text-sm text-foreground-light transition-colors hover:bg-muted hover:text-foreground motion-reduce:transition-none',
      className
    )}
    {...props}
  >
    <span>{children}</span>
    <span aria-hidden="true" className="shrink-0">
      {icon ?? (
        <ChevronDown
          size={16}
          className="transition-transform group-data-open/trigger:rotate-180 motion-reduce:transition-none"
        />
      )}
    </span>
  </CollapsibleTrigger>
)

export const DialogDisclosureContent = ({
  className,
  ...props
}: ComponentProps<typeof CollapsibleContent>) => (
  <CollapsibleContent
    className={cn(
      '[overflow-y:clip] data-closed:animate-collapsible-up data-open:animate-collapsible-down motion-reduce:animate-none',
      className
    )}
    {...props}
  />
)
