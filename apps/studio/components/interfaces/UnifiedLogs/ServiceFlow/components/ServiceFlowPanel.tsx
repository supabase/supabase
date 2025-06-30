import {
  AlertCircle,
  CheckCircle,
  Clock,
  Globe,
  Key,
  Shield,
  Database,
  Zap,
  User,
} from 'lucide-react'
import { Badge } from 'ui'
import type { ServiceFlowData, ServiceLayer, ServiceLogEntry } from '../../ServiceFlow.types'

interface ServiceFlowPanelProps {
  data: ServiceFlowData
  isLoading?: boolean
  error?: Error | null
}

export const ServiceFlowPanel = ({ data, isLoading, error }: ServiceFlowPanelProps) => {
  if (isLoading) {
    return <ServiceFlowSkeleton />
  }

  if (error) {
    return (
      <div className="p-4 text-sm text-foreground-light">
        <div className="flex items-center gap-2 text-warning">
          <AlertCircle size={16} />
          Error loading service flow: {error.message}
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="p-4 text-sm text-foreground-light">
        No service flow data available for this request.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-foreground">Service Flow</h3>
          <p className="text-xs text-foreground-light">
            {data.request_path} • {data.total_duration_ms}ms
          </p>
        </div>
        <StatusBadge status={data.overall_status} />
      </div>

      {/* Service Layers */}
      <div className="space-y-3">
        {data.layers
          .sort((a, b) => getLayerOrder(a.layer) - getLayerOrder(b.layer))
          .map((layer) => (
            <ServiceLayerCard key={layer.layer} layer={layer} />
          ))}
      </div>

      {/* Footer */}
      <div className="text-xs text-foreground-light pt-2 border-t border-border">
        Correlation window: {formatTime(data.correlation_window.start)} -{' '}
        {formatTime(data.correlation_window.end)}
      </div>
    </div>
  )
}

const ServiceLayerCard = ({ layer }: { layer: ServiceLayer }) => {
  const Icon = getLayerIcon(layer.layer)

  return (
    <div className="border border-border rounded-lg">
      {/* Layer Header */}
      <div className="flex items-center justify-between p-3 bg-surface-100">
        <div className="flex items-center gap-2">
          <Icon size={16} className={getLayerIconColor(layer.layer)} />
          <span className="text-sm font-medium">{layer.display_name}</span>
          <StatusBadge status={layer.status} size="small" />
        </div>
        <div className="flex items-center gap-2 text-xs text-foreground-light">
          {(layer.total_duration_ms ?? 0) > 0 && (
            <div className="flex items-center gap-2">
              <Clock size={12} />
              {layer.total_duration_ms}ms
            </div>
          )}
          <div>
            {layer.request_count} request{layer.request_count !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Layer Details */}
      <div className="p-3 space-y-2">
        {layer.logs.map((log) => (
          <ServiceLogRow key={log.id} log={log} layer={layer.layer} />
        ))}
      </div>
    </div>
  )
}

const ServiceLogRow = ({ log, layer }: { log: ServiceLogEntry; layer: string }) => {
  return (
    <div className="flex items-center justify-between py-1">
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <StatusDot status={log.level} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-foreground">{formatTime(log.timestamp)}</span>
            {log.status && (
              <Badge variant={log.level === 'error' ? 'destructive' : 'default'} size="small">
                {log.status}
              </Badge>
            )}
            {log.method && <span className="text-foreground-light">{log.method}</span>}
          </div>
          <LayerSpecificDetails log={log} layer={layer} />
        </div>
      </div>
      {(log.duration_ms ?? 0) > 0 && (
        <div className="text-xs text-foreground-light flex items-center gap-1">
          <Clock size={10} />
          {log.duration_ms}ms
        </div>
      )}
    </div>
  )
}

const LayerSpecificDetails = ({ log, layer }: { log: ServiceLogEntry; layer: string }) => {
  switch (layer) {
    case 'network':
      return (
        <div className="text-xs text-foreground-light space-y-1">
          {log.cf_ray && <div>CF-Ray: {log.cf_ray}</div>}
          {log.cf_country && <div>Country: {log.cf_country}</div>}
          {log.ip_address && <div>IP: {log.ip_address}</div>}
        </div>
      )

    case 'api':
      return (
        <div className="text-xs text-foreground-light space-y-1">
          {log.api_key_role && (
            <div className="flex items-center gap-1">
              <Key size={10} />
              API Key:{' '}
              <Badge variant="secondary" size="small">
                {log.api_key_role}
              </Badge>
            </div>
          )}
          {log.api_key_prefix && <div>Key: {log.api_key_prefix}...</div>}
          {log.api_key_error && <div className="text-destructive">Error: {log.api_key_error}</div>}
        </div>
      )

    case 'user':
      return (
        <div className="text-xs text-foreground-light space-y-1">
          {log.auth_role && (
            <div className="flex items-center gap-1">
              <Shield size={10} />
              Role:{' '}
              <Badge variant="secondary" size="small">
                {log.auth_role}
              </Badge>
            </div>
          )}
          {log.user_email && <div>User: {log.user_email}</div>}
          {log.user_id && <div>ID: {log.user_id.substring(0, 8)}...</div>}
        </div>
      )

    case 'postgrest':
      return (
        <div className="text-xs text-foreground-light">
          {log.path && <div>Path: {log.path}</div>}
        </div>
      )

    case 'postgres':
      return <div className="text-xs text-foreground-light">Database query execution</div>

    default:
      return null
  }
}

const StatusBadge = ({
  status,
  size = 'default',
}: {
  status: string
  size?: 'small' | 'default'
}) => {
  const variant =
    status === 'error' ? 'destructive' : status === 'warning' ? 'default' : 'secondary'
  const badgeSize = size === 'default' ? undefined : 'small'
  return (
    <Badge variant={variant} size={badgeSize}>
      {status}
    </Badge>
  )
}

const StatusDot = ({ status }: { status: string }) => {
  const color =
    status === 'error' ? 'bg-destructive' : status === 'warning' ? 'bg-warning' : 'bg-brand'
  return <div className={`w-2 h-2 rounded-full ${color}`} />
}

const getLayerIcon = (layer: string) => {
  switch (layer) {
    case 'network':
      return Globe
    case 'api':
      return Key
    case 'user':
      return User
    case 'postgrest':
      return Zap
    case 'postgres':
      return Database
    default:
      return CheckCircle
  }
}

const getLayerIconColor = (layer: string) => {
  switch (layer) {
    case 'network':
      return 'text-blue-500'
    case 'api':
      return 'text-purple-500'
    case 'user':
      return 'text-green-500'
    case 'postgrest':
      return 'text-orange-500'
    case 'postgres':
      return 'text-indigo-500'
    default:
      return 'text-foreground-light'
  }
}

const getLayerOrder = (layer: string): number => {
  switch (layer) {
    case 'network':
      return 1
    case 'api':
      return 2
    case 'user':
      return 3
    case 'postgrest':
      return 4
    case 'postgres':
      return 5
    default:
      return 999
  }
}

const formatTime = (timestamp: string) => {
  return new Date(timestamp).toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    fractionalSecondDigits: 3,
  })
}

const ServiceFlowSkeleton = () => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="h-4 w-24 bg-border rounded animate-pulse" />
          <div className="h-3 w-32 bg-border rounded animate-pulse" />
        </div>
        <div className="h-5 w-16 bg-border rounded animate-pulse" />
      </div>

      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="border border-border rounded-lg">
          <div className="flex items-center justify-between p-3 bg-surface-100">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-border rounded animate-pulse" />
              <div className="h-4 w-20 bg-border rounded animate-pulse" />
              <div className="h-4 w-12 bg-border rounded animate-pulse" />
            </div>
            <div className="h-3 w-16 bg-border rounded animate-pulse" />
          </div>
          <div className="p-3">
            <div className="h-3 w-full bg-border rounded animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  )
}
