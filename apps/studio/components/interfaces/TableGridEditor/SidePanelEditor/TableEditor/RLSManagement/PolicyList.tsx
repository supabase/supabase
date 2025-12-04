import { X } from 'lucide-react'

import {
  Badge,
  Card,
  cn,
  HoverCard_Shadcn_,
  HoverCardContent_Shadcn_,
  HoverCardTrigger_Shadcn_,
  SimpleCodeBlock,
} from 'ui'

export interface PolicyListItemData {
  name: string
  command?: string | null
  sql?: string | null
  isNew?: boolean
}

interface PolicyListItemProps {
  policy: PolicyListItemData
  onRemove?: () => void
}

/**
 * A shared component for displaying policy items with hover preview
 * Used in RLSManagement and policy creation toast notifications
 */
export const PolicyListItem = ({ policy, onRemove }: PolicyListItemProps) => {
  return (
    <HoverCard_Shadcn_ openDelay={200} closeDelay={100}>
      <HoverCardTrigger_Shadcn_ asChild>
        <div
          className={cn(
            'flex items-center justify-between text-sm text-foreground py-2 px-3 hover:bg-surface-100 transition-colors',
            'border-b border-default last:border-b-0'
          )}
        >
          <code className="text-xs truncate flex-1">{policy.name}</code>

          <div className="flex items-center gap-2">
            {policy.command && <Badge variant="default">{policy.command}</Badge>}
            {policy.isNew && <Badge variant="success">New</Badge>}
            {!!onRemove && policy.isNew && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onRemove()
                }}
                className="flex items-center justify-center hover:bg-surface-200 rounded p-0.5 transition-colors"
                aria-label="Remove policy"
              >
                <X size={16} strokeWidth={1.5} className="text-foreground-lighter" />
              </button>
            )}
          </div>
        </div>
      </HoverCardTrigger_Shadcn_>
      <HoverCardContent_Shadcn_ className="w-96" side="left">
        {policy.sql ? (
          <SimpleCodeBlock className="language-sql" showCopy={false}>
            {policy.sql}
          </SimpleCodeBlock>
        ) : (
          <p className="text-xs text-foreground-lighter">No definition available.</p>
        )}
      </HoverCardContent_Shadcn_>
    </HoverCard_Shadcn_>
  )
}

interface PolicyListProps {
  disabled?: boolean
  policies: PolicyListItemData[]
  className?: string
  onRemove?: (index: number) => void
}

/**
 * A list of policies with hover previews
 * Used in RLSManagement and toast notifications
 */
export const PolicyList = ({
  disabled = false,
  policies,
  className,
  onRemove,
}: PolicyListProps) => {
  return (
    <Card aria-disabled={disabled} className={cn(disabled && 'opacity-50 pointer-events-none')}>
      <div
        className={`rounded border border-default overflow-hidden bg-surface-100 ${className ?? ''}`}
      >
        {policies.map((policy, idx) => (
          <PolicyListItem
            key={`${policy.name}-${idx}`}
            policy={policy}
            onRemove={onRemove ? () => onRemove(idx) : undefined}
          />
        ))}
      </div>
    </Card>
  )
}
