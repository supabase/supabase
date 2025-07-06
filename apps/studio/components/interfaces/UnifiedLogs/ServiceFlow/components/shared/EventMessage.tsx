import { Database, LucideIcon } from 'lucide-react'
import { LEVELS } from 'components/ui/DataTable/DataTable.constants'
import { LOG_TYPES } from '../../../UnifiedLogs.constants'

type LogType = (typeof LOG_TYPES)[number]
type Level = (typeof LEVELS)[number]

export interface EventMessageProps {
  message: string
  severity?: Level
  icon?: LucideIcon
  serviceType?: LogType
}

export const EventMessage = ({
  message,
  severity,
  icon: Icon = Database,
  serviceType = 'postgres',
}: EventMessageProps) => {
  const getSeverityColor = (severity?: Level) => {
    switch (severity) {
      case 'error':
        return 'border-destructive/20 bg-destructive/5 text-destructive'
      case 'warning':
        return 'border-warning/20 bg-warning/5 text-warning-foreground'
      default:
        return 'border-border bg-surface-100 text-foreground'
    }
  }

  const getSeverityIcon = (severity?: Level) => {
    switch (severity) {
      case 'error':
        return 'text-destructive'
      case 'warning':
        return 'text-warning'
      default:
        return 'text-foreground-light'
    }
  }

  // Format service type for display (capitalize edge function)
  const displayServiceType =
    serviceType === 'edge function'
      ? 'Edge Function'
      : serviceType.charAt(0).toUpperCase() + serviceType.slice(1)

  return (
    <div className="mt-3 border-t border-border pt-3">
      <div className="flex items-center gap-2 mb-2">
        <Icon size={14} className={getSeverityIcon(severity)} />
        <span className="text-xs font-medium text-foreground-light">
          {displayServiceType} Event
          {severity && (
            <span
              className={`ml-2 px-1.5 py-0.5 rounded text-xs font-medium ${getSeverityColor(severity)}`}
            >
              {severity.toUpperCase()}
            </span>
          )}
        </span>
      </div>
      <div className={`p-3 rounded-lg border ${getSeverityColor(severity)}`}>
        <div className="text-sm font-mono break-words whitespace-pre-wrap leading-relaxed">
          {message}
        </div>
      </div>
    </div>
  )
}
