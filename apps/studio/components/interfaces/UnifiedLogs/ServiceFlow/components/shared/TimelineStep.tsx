import { DataTableColumnStatusCode } from 'components/ui/DataTable/DataTableColumn/DataTableColumnStatusCode'
import { Clock, Globe, Server, Database } from 'lucide-react'
import { Auth, EdgeFunctions, Storage } from 'icons'
import { cn } from 'ui'
import { getStatusLevel } from '../../../UnifiedLogs.utils'
import { LucideIcon } from 'lucide-react'

// Type for icon components (covers both lucide-react and our icon library)
type IconComponent = LucideIcon | React.ComponentType<any>

// Reusable styled icon component
const StyledIcon = ({ icon: Icon, title }: { icon: IconComponent; title: string }) => (
  <div className="flex items-center gap-2 bg-surface-300 rounded p-0.5 border justify-center border-foreground-muted">
    <Icon className="w-4 h-4 text-foreground-lighter" strokeWidth={1} />
  </div>
)

const TimelineStep = ({
  title,
  status,
  statusText,
  children,
  completionTime,
  isLast = false,
}: {
  title: string
  status?: number | string
  statusText?: string
  children: React.ReactNode
  completionTime?: string
  isLast?: boolean
}) => (
  <>
    <div className="relative">
      {/* Timeline dot - positioned on the left timeline line */}
      <div className="py-1 bg-surface-100/50 border-r border-t border-l rounded-t px-2">
        <div>
          <div className="flex flex-row justify-between">
            <div className="flex items-center gap-2">
              {title === 'Request started' && <StyledIcon icon={Clock} title={title} />}
              {title === 'Network' && <StyledIcon icon={Globe} title={title} />}
              {title === 'Data API' && <StyledIcon icon={Server} title={title} />}
              {title === 'Authentication' && <StyledIcon icon={Auth} title={title} />}
              {title === 'Edge Function' && <StyledIcon icon={EdgeFunctions} title={title} />}
              {title === 'Storage' && <StyledIcon icon={Storage} title={title} />}
              {title === 'Postgres' && <StyledIcon icon={Database} title={title} />}
              {title === 'Response' && <StyledIcon icon={Clock} title={title} />}
              <h3 className="text-sm text-foreground tracking-wide">{title}</h3>
            </div>

            {statusText && (
              <span className="text-xs text-foreground-light tracking-wide">{statusText}</span>
            )}

            {status && (
              <DataTableColumnStatusCode
                value={status}
                level={getStatusLevel(status)}
                className="text-xs"
              />
            )}
          </div>
        </div>
      </div>

      {/* Main section box */}
      <div className="border rounded-b border-border">
        {/* Content */}
        <dl className="space-y-0 divide-y px-1 py-1 bg-surface-100/50">{children}</dl>
      </div>
      {!isLast && <div className="border-l h-3 ml-5"></div>}
    </div>
  </>
)

export { TimelineStep, StyledIcon }
