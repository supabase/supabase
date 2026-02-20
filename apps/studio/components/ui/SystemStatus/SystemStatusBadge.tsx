import { useFlag } from 'common'
import { ArrowUpRight } from 'lucide-react'
import Link from 'next/link'
import { Badge, Button, cn, Tooltip, TooltipContent, TooltipTrigger } from 'ui'

import { deriveSystemStatus, getBadgeConfig, getTooltipContent } from './SystemStatus.utils'
import { useIncidentStatusQuery } from '@/data/platform/incident-status-query'

export const SystemStatusBadge = () => {
  const { data: allStatusPageEvents } = useIncidentStatusQuery()
  const { incidents = [], maintenanceEvents = [] } = allStatusPageEvents ?? {}

  const hasIncident =
    useFlag('ongoingIncident') || process.env.NEXT_PUBLIC_ONGOING_INCIDENT === 'true'

  const status = deriveSystemStatus({ maintenanceEvents, hasIncident })
  const currentIncident = incidents[0]
  const currentMaintenance = maintenanceEvents[0]

  const badgeConfig = getBadgeConfig(status)
  const isOperational = status === 'operational'

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge
          variant={badgeConfig.variant}
          className={cn('flex items-center gap-1', badgeConfig.hoverStyle)}
        >
          {badgeConfig.icon}
          {!isOperational ? badgeConfig.label : null}
        </Badge>
      </TooltipTrigger>
      <TooltipContent side="bottom" align="start" className="w-screen !max-w-[240px] p-0">
        {getTooltipContent({
          status,
          incident: currentIncident,
          maintenanceEvent: currentMaintenance,
        })}
        <footer className="w-full flex flex-col items-start gap-1 p-2 bg-overlay border-t">
          <Button
            asChild
            type="default"
            size="tiny"
            iconRight={<ArrowUpRight className="w-3 h-3" />}
          >
            <Link href="https://status.supabase.com" target="_blank" rel="noreferrer noopener">
              View Status Page
            </Link>
          </Button>
        </footer>
      </TooltipContent>
    </Tooltip>
  )
}
