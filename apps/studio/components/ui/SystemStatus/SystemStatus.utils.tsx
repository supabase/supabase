import type { IncidentInfo } from 'lib/api/incident-status'
import { AlertCircleIcon, Cog } from 'lucide-react'
import { Separator } from 'ui'

import { SystemStatusIcon } from './SystemStatusIcon'

export type SystemStatus = 'operational' | 'incident' | 'maintenance'

interface BadgeVariant {
  variant: 'success' | 'warning' | 'default'
  label: string
  icon: JSX.Element
  hoverStyle: string
}

export function deriveSystemStatus({
  maintenanceEvents,
  hasIncident,
}: {
  maintenanceEvents: IncidentInfo[]
  hasIncident: boolean
}): SystemStatus {
  if (hasIncident) return 'incident'
  if (maintenanceEvents.length > 0) return 'maintenance'
  return 'operational'
}

export function getBadgeConfig(status: SystemStatus): BadgeVariant {
  switch (status) {
    case 'operational':
      return {
        variant: 'success',
        label: 'Operational',
        icon: <SystemStatusIcon status="operational" />,
        hoverStyle:
          'transition aspect-square border-transparent hover:border-stronger bg-transparent',
      }
    case 'incident':
      return {
        variant: 'warning',
        label: 'Investigating issue',
        icon: <AlertCircleIcon className="w-3 h-3" />,
        hoverStyle: '',
      }
    case 'maintenance':
      return {
        variant: 'default',
        label: 'Ongoing Maintenance',
        icon: <Cog className="w-3 h-3" />,
        hoverStyle: '',
      }
  }
}

function formatActiveSince(dateString: string): string {
  try {
    const date = new Date(dateString)
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short',
    })
  } catch {
    return dateString
  }
}

export interface TooltipContentProps {
  status: SystemStatus
  incident?: IncidentInfo
  maintenanceEvent?: IncidentInfo
}

export function getTooltipContent({ status, incident, maintenanceEvent }: TooltipContentProps) {
  if (status === 'operational') {
    return (
      <div className="flex flex-col gap-2 p-2">
        <p className="text-xs text-foreground-lighter">All systems are operational</p>
      </div>
    )
  }

  if (status === 'incident') {
    return (
      <div className="flex flex-col gap-2 p-2">
        <p className="text-xs text-foreground-light">We are investigating a technical issue</p>
        {!!incident && (
          <>
            <Separator />
            <div>
              <p className="text-xs text-warning">{incident.name}</p>
            </div>
          </>
        )}
      </div>
    )
  }

  if (status === 'maintenance') {
    return (
      <div className="flex flex-col gap-2 p-2">
        <p className="text-xs text-foreground-light">
          Scheduled maintenance is currently in progress
          <span className="inline-block w-[1.2em] text-left after:content-[''] after:animate-ellipsis after:inline-block" />
        </p>
        {maintenanceEvent && (
          <div className="flex flex-col gap-0.5 text-xs text-foreground-lighter">
            <p>{maintenanceEvent.name}</p>
            <p>{formatActiveSince(maintenanceEvent.active_since)}</p>
          </div>
        )}
      </div>
    )
  }

  return null
}
