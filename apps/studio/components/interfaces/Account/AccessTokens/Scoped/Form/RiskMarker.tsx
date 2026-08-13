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
          <div className="flex flex-col gap-5 mt-5">
            {entry.allowsRead.length > 0 && (
              <span className="text-xs text-foreground-light">
                <h3 className="text-foreground-muted text-[11px] uppercase font-mono tracking-wide font-normal mb-0.5">
                  Read:{' '}
                </h3>
                {entry.allowsRead.join(', ')}
              </span>
            )}
            {entry.allowsWrite.length > 0 && (
              <span className="text-xs text-foreground-light">
                <h3 className="text-foreground-muted text-[11px] uppercase font-mono tracking-wide font-normal mb-0.5">
                  Write:{' '}
                </h3>
                {entry.allowsWrite.join(', ')}
              </span>
            )}
          </div>
        )}
        {mcpTools.length > 0 && (
          <div className="space-y-1 mt-5">
            {/* getMcpToolsForScopes is associative, not conjunctive: these scopes contribute to
                the listed tools, but a tool may need scopes from other capabilities too — the
                review step's enabled-tools list is the authoritative view. Keep this heading
                distinct from the review step's "MCP tools". */}
            <p className="text-[11px] font-mono uppercase tracking-wide text-foreground-lighter">
              Related MCP tools
            </p>
            <p className="font-mono text-xs text-foreground-light">{mcpTools.join(', ')}</p>
          </div>
        )}
      </TooltipContent>
    </Tooltip>
  )
}
