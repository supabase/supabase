import { cn, Tooltip, TooltipContent, TooltipTrigger } from 'ui'

import {
  RISK_LEVEL_LABEL,
  type PermissionCatalogEntry,
  type RiskLevel,
} from '../../AccessToken.permissions'
import { getMcpToolsForScopes } from '@/data/access-tokens/permission-scope-map'

const DOT_CLASS: Record<RiskLevel, string> = {
  low: 'bg-brand',
  medium: 'bg-warning-600',
  high: 'bg-destructive-600',
}

const LABEL_CLASS: Record<RiskLevel, string> = {
  low: 'text-brand-600',
  medium: 'text-warning-600',
  high: 'text-destructive-600',
}

interface RiskMarkerProps {
  entry: PermissionCatalogEntry
  /** When false, renders the dot + label without the explanatory tooltip (used in the review list). */
  withTooltip?: boolean
  className?: string
}

export const RiskMarker = ({ entry, withTooltip = true, className }: RiskMarkerProps) => {
  const marker = (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 text-xs',
        withTooltip && 'cursor-help',
        LABEL_CLASS[entry.risk],
        className
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', DOT_CLASS[entry.risk])} />
      {RISK_LEVEL_LABEL[entry.risk]}
    </span>
  )

  if (!withTooltip) return marker

  const mcpTools = getMcpToolsForScopes([...entry.readScopes, ...entry.writeScopes])

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span tabIndex={0}>{marker}</span>
      </TooltipTrigger>
      <TooltipContent side="top" align="start" className="w-72 space-y-2 p-3">
        <div
          className={cn('flex items-center gap-1.5 text-xs font-medium', LABEL_CLASS[entry.risk])}
        >
          <span className={cn('h-1.5 w-1.5 rounded-full', DOT_CLASS[entry.risk])} />
          {RISK_LEVEL_LABEL[entry.risk]}
        </div>
        <p className="text-xs text-foreground-light">{entry.riskReason}</p>
        {(entry.allowsRead.length > 0 || entry.allowsWrite.length > 0) && (
          <div className="space-y-1">
            <p className="text-[11px] font-mono uppercase tracking-wide text-foreground-lighter">
              Allows
            </p>
            {entry.allowsRead.length > 0 && (
              <p className="text-xs text-foreground-light">Read · {entry.allowsRead.join(', ')}</p>
            )}
            {entry.allowsWrite.length > 0 && (
              <p className="text-xs text-foreground-light">
                Write · {entry.allowsWrite.join(', ')}
              </p>
            )}
          </div>
        )}
        {mcpTools.length > 0 && (
          <div className="space-y-1">
            <p className="text-[11px] font-mono uppercase tracking-wide text-foreground-lighter">
              MCP tools
            </p>
            <p className="font-mono text-xs text-foreground-light">{mcpTools.join(', ')}</p>
          </div>
        )}
      </TooltipContent>
    </Tooltip>
  )
}
