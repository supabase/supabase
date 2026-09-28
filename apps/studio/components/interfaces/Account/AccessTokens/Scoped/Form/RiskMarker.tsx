import { Badge, cn, Tooltip, TooltipContent, TooltipTrigger } from 'ui'

import {
  RISK_LEVEL_LABEL,
  RISK_TONE_VARIANT,
  type PermissionCatalogEntry,
} from '../../AccessToken.permissions'

interface RiskMarkerProps {
  entry: PermissionCatalogEntry
  className?: string
}

export const RiskMarker = ({ entry, className }: RiskMarkerProps) => {
  const marker = (
    <Badge variant={RISK_TONE_VARIANT[entry.risk]} className={cn('cursor-help', className)}>
      {RISK_LEVEL_LABEL[entry.risk]}
    </Badge>
  )

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span tabIndex={0}>{marker}</span>
      </TooltipTrigger>
      <TooltipContent side="top" align="center" className="w-72 space-y-2 p-3">
        <Badge variant={RISK_TONE_VARIANT[entry.risk]}>{RISK_LEVEL_LABEL[entry.risk]}</Badge>
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
      </TooltipContent>
    </Tooltip>
  )
}
