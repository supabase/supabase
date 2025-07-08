import { Database, LucideIcon } from 'lucide-react'

import { LEVELS } from 'components/ui/DataTable/DataTable.constants'
import { Badge } from 'ui'
import { LOG_TYPES } from '../../../UnifiedLogs.constants'
import { formatServiceTypeForDisplay } from '../../../UnifiedLogs.utils'

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

  return (
    <div className="mt-3 border-t border-border pt-3">
      <div className="flex items-center gap-2 mb-2">
        <Icon size={14} className={getSeverityIcon(severity)} />
        <span className="text-xs font-medium text-foreground-light">
          {formatServiceTypeForDisplay(serviceType)} Event
          {severity && (
            <Badge
              variant={
                severity === 'error'
                  ? 'destructive'
                  : severity === 'warning'
                    ? 'warning'
                    : 'default'
              }
              className="ml-2 text-xs"
            >
              {severity.toUpperCase()}
            </Badge>
          )}
        </span>
      </div>
      <div className="p-3 rounded-lg border border-border bg-surface-100">
        <div className="text-xs font-mono break-all whitespace-pre-wrap leading-relaxed max-h-32 overflow-y-auto">
          {message}
        </div>
      </div>
    </div>
  )
}
