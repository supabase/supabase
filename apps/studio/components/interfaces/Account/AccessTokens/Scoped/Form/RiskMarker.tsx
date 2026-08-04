import { Badge, cn, Tooltip, TooltipContent, TooltipTrigger } from 'ui'

import {
  RISK_LEVEL_LABEL,
  type PermissionCatalogEntry,
  type RiskLevel,
} from '../../AccessToken.permissions'
import {
  getMcpToolsForScopes,
  PermissionScopeMap,
} from '@/data/scoped-access-tokens/permission-scope-map-query'

const RISK_VARIANT: Record<RiskLevel, 'success' | 'warning' | 'destructive'> = {
  low: 'success',
  medium: 'warning',
  high: 'destructive',
}

interface RiskMarkerProps {
  entry: PermissionCatalogEntry
  /** When false, renders the dot + label without the explanatory tooltip (used in the review list). */
  withTooltip?: boolean
  className?: string
  permissionScopeMap: PermissionScopeMap | undefined
}

export const RiskMarker = ({
  entry,
  withTooltip = true,
  className,
  permissionScopeMap,
}: RiskMarkerProps) => {
  const marker = (
    <Badge
      variant={RISK_VARIANT[entry.risk]}
      className={cn(withTooltip && 'cursor-help', className)}
    >
      {RISK_LEVEL_LABEL[entry.risk]}
    </Badge>
  )

  if (!withTooltip) return marker

  const mcpTools = getMcpToolsForScopes({
    scopeIds: [...entry.readScopes, ...entry.writeScopes],
    permissionScopeMap,
  })

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span tabIndex={0}>{marker}</span>
      </TooltipTrigger>
      <TooltipContent side="top" align="center" className="w-72 space-y-2 p-3">
        <Badge variant={RISK_VARIANT[entry.risk]}>{RISK_LEVEL_LABEL[entry.risk]}</Badge>
        <p className="text-xs text-foreground-light">{entry.riskReason}</p>
        {(entry.allowsRead.length > 0 || entry.allowsWrite.length > 0) && (
          <div className="space-y-2 mt-5">
            {/*<h3 className="text-[11px] font-mono uppercase tracking-wide text-foreground-muted">
              Allows
            </h3>*/}
            {entry.allowsRead.length > 0 && (
              <p className="text-xs text-foreground-light">
                <span className="text-foreground-lighter">Read: </span>
                {entry.allowsRead.join(', ')}
              </p>
            )}
            {entry.allowsWrite.length > 0 && (
              <p className="text-xs text-foreground-light">
                <span className="text-foreground-lighter">Write: </span>
                {entry.allowsWrite.join(', ')}
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
