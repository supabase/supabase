import { GlobeIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { Badge, cn, Tooltip, TooltipContent, TooltipTrigger } from 'ui'

import type { RestrictionChange, RestrictionIssue } from './NetworkRestrictions.utils'

interface RestrictionRowProps {
  entry: string
  type: 'IPv4' | 'IPv6'
  change?: RestrictionChange
  issue?: RestrictionIssue
  actions?: ReactNode
}

export const RestrictionRow = ({
  entry,
  type,
  change = 'unchanged',
  issue,
  actions,
}: RestrictionRowProps) => (
  <div className="py-4 flex items-center justify-between">
    <div className="flex items-center space-x-5">
      <GlobeIcon size={16} className="text-foreground-lighter" />
      <Badge>{type}</Badge>
      <p
        className={cn(
          'text-sm font-mono',
          change === 'adding' && 'text-brand-600',
          change === 'removing' && 'text-destructive-600 line-through'
        )}
      >
        {entry}
      </p>
      {change === 'adding' && <Badge variant="success">Adding</Badge>}
      {change === 'removing' && <Badge variant="destructive">Removing</Badge>}
      {issue !== undefined && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="warning">Invalid</Badge>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-80">
            {issue.message}.{issue.suggestion !== undefined && ` Did you mean ${issue.suggestion}?`}
          </TooltipContent>
        </Tooltip>
      )}
    </div>
    {actions}
  </div>
)
