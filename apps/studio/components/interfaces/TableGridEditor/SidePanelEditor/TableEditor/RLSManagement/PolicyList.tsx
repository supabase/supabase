import {
  Badge,
  HoverCard_Shadcn_,
  HoverCardContent_Shadcn_,
  HoverCardTrigger_Shadcn_,
  SimpleCodeBlock,
} from 'ui'

export interface PolicyListItemData {
  name: string
  command?: string | null
  sql?: string | null
}

interface PolicyListItemProps {
  policy: PolicyListItemData
  className?: string
}

/**
 * A shared component for displaying policy items with hover preview
 * Used in RLSManagement and policy creation toast notifications
 */
export const PolicyListItem = ({ policy, className }: PolicyListItemProps) => {
  return (
    <HoverCard_Shadcn_ openDelay={200} closeDelay={100}>
      <HoverCardTrigger_Shadcn_ asChild>
        <div
          className={`flex items-center justify-between text-sm text-foreground py-2 px-3 hover:bg-surface-100 cursor-pointer transition-colors ${className ?? ''}`}
        >
          <p className="font-mono text-xs truncate max-w-[200px]">{policy.name}</p>
          {policy.command && <Badge variant="default">{policy.command}</Badge>}
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
  policies: PolicyListItemData[]
  className?: string
}

/**
 * A list of policies with hover previews
 * Used in RLSManagement and toast notifications
 */
export const PolicyList = ({ policies, className }: PolicyListProps) => {
  return (
    <div
      className={`rounded border border-default overflow-hidden bg-surface-100 ${className ?? ''}`}
    >
      {policies.map((policy, idx) => (
        <PolicyListItem
          key={`${policy.name}-${idx}`}
          policy={policy}
          className={idx < policies.length - 1 ? 'border-b border-default' : ''}
        />
      ))}
    </div>
  )
}
