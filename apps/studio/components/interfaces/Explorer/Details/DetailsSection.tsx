import { ChevronDownIcon, PlusIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn, Collapsible, CollapsibleContent, CollapsibleTrigger } from 'ui'

import { InlineLink } from '@/components/ui/InlineLink'

/**
 * A titled, collapsible group in the query details panel. The count sits beside the title as
 * plain text, and an optional action (such as adding a policy) sits at the far end. Groups
 * are ruled off from one another edge to edge, with the same space either side of the rule.
 */
export const DetailsSection = ({
  title,
  count,
  action,
  defaultOpen = true,
  children,
}: {
  title: string
  count?: number
  action?: ReactNode
  defaultOpen?: boolean
  children: ReactNode
}) => (
  <Collapsible defaultOpen={defaultOpen} className="border-t px-4 py-3">
    <div className="flex h-8 items-center justify-between gap-x-2">
      <CollapsibleTrigger className="group flex min-w-0 items-center gap-x-1.5 heading-meta text-foreground-lighter transition-colors hover:text-foreground">
        <span>{title}</span>
        {count !== undefined && <span className="text-foreground-muted">{count}</span>}
        <ChevronDownIcon
          size={12}
          strokeWidth={2}
          className="text-foreground-muted transition-transform group-data-[state=closed]:-rotate-90"
        />
      </CollapsibleTrigger>
      {action}
    </div>
    <CollapsibleContent className="pt-1">{children}</CollapsibleContent>
  </Collapsible>
)

export const DetailsProperties = ({ children }: { children: ReactNode }) => (
  <dl className="flex flex-col">{children}</dl>
)

/** A label and its value on one line, the label muted so the values read down the column. */
export const DetailsProperty = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="grid min-h-8 grid-cols-[7rem_minmax(0,1fr)] items-center gap-x-3 text-sm">
    <dt className="truncate text-foreground-lighter" title={label}>
      {label}
    </dt>
    <dd className="flex min-w-0 items-center justify-between gap-x-2 text-foreground">
      {children}
    </dd>
  </div>
)

export const DetailsList = ({ children }: { children: ReactNode }) => (
  <ul className="flex flex-col gap-y-2">{children}</ul>
)

/** A named item with a one-line description beneath, both truncated to the panel width. */
export const DetailsListItem = ({
  title,
  description,
  action,
  className,
}: {
  title: ReactNode
  description?: ReactNode
  action?: ReactNode
  className?: string
}) => (
  <li className={cn('group/item flex min-w-0 items-start gap-x-2', className)}>
    <div className="min-w-0 flex-1">
      <p className="truncate text-sm text-foreground">{title}</p>
      {description && <p className="truncate text-sm text-foreground-lighter">{description}</p>}
    </div>
    {action}
  </li>
)

export const DetailsEmpty = ({ children }: { children: ReactNode }) => (
  <p className="text-sm text-foreground-lighter">{children}</p>
)

/** A small inline text action, such as "Enable" beside a property value. */
export const DetailsAction = ({
  children,
  onClick,
}: {
  children: ReactNode
  onClick: () => void
}) => (
  <button
    type="button"
    tabIndex={0}
    className="shrink-0 text-sm text-foreground-lighter underline-offset-2 transition-colors hover:text-foreground hover:underline"
    onClick={onClick}
  >
    {children}
  </button>
)

/** A section's "+" action, leading to wherever that kind of object is created. */
export const DetailsAddLink = ({ href, label }: { href: string; label: string }) => (
  <InlineLink
    href={href}
    title={label}
    className="flex h-6 w-6 items-center justify-center rounded text-foreground-lighter no-underline hover:bg-surface-200 hover:text-foreground"
  >
    <PlusIcon size={14} strokeWidth={2} aria-hidden />
    <span className="sr-only">{label}</span>
  </InlineLink>
)
