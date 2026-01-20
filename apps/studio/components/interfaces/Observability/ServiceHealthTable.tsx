import Link from 'next/link'
import { HelpCircle } from 'lucide-react'
import {
  cn,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from 'ui'
import { getHealthStatus, type ServiceKey } from './ObservabilityOverview.utils'
import type { LogsBarChartDatum } from '../HomeNew/ProjectUsage.metrics'

type ServiceConfig = {
  key: ServiceKey
  name: string
  description: string
  reportUrl?: string
  logsUrl: string
}

type ServiceData = {
  total: number
  errorRate: number
  errorCount: number
  warningCount: number
  eventChartData: LogsBarChartDatum[]
  isLoading: boolean
}

type IntervalKey = '1hr' | '1day' | '7day'

export type ServiceHealthTableProps = {
  services: ServiceConfig[]
  serviceData: Record<string, ServiceData>
  onBarClick: (serviceKey: string, logsUrl: string) => (datum: LogsBarChartDatum) => void
  interval: IntervalKey
}

const SERVICE_DESCRIPTIONS: Record<ServiceKey, string> = {
  db: 'PostgreSQL database health and performance',
  auth: 'Authentication and user management',
  functions: 'Serverless Edge Functions execution',
  storage: 'Object storage for files and assets',
  realtime: 'WebSocket connections and broadcasts',
  postgrest: 'Auto-generated REST API for your database',
}

const getIntervalLabels = (interval: IntervalKey): { startLabel: string; endLabel: string } => {
  switch (interval) {
    case '1hr':
      return { startLabel: '60 min ago', endLabel: 'Now' }
    case '1day':
      return { startLabel: '24 hours ago', endLabel: 'Now' }
    case '7day':
      return { startLabel: '7 days ago', endLabel: 'Now' }
    default:
      return { startLabel: 'Start', endLabel: 'Now' }
  }
}

const getStatusLabel = (status: 'healthy' | 'warning' | 'error' | 'no-data'): string => {
  switch (status) {
    case 'healthy':
      return 'Operational'
    case 'warning':
      return 'Degraded'
    case 'error':
      return 'Outage'
    case 'no-data':
      return 'No data'
  }
}

const getStatusColor = (status: 'healthy' | 'warning' | 'error' | 'no-data'): string => {
  switch (status) {
    case 'healthy':
      return 'text-brand'
    case 'warning':
      return 'text-warning'
    case 'error':
      return 'text-destructive'
    case 'no-data':
      return 'text-foreground-lighter'
  }
}

const getBarTotal = (datum: LogsBarChartDatum): number => {
  return datum.ok_count + datum.warning_count + datum.error_count
}

const getBarColor = (datum: LogsBarChartDatum, total: number): string => {
  if (total === 0) return 'bg-surface-300'

  const barTotal = getBarTotal(datum)
  if (barTotal === 0) return 'bg-surface-300'

  const errorRate = (datum.error_count / barTotal) * 100

  if (errorRate >= 15) return 'bg-destructive'
  if (datum.error_count > 0 || datum.warning_count > 0) return 'bg-warning'
  return 'bg-brand'
}

type ServiceRowProps = {
  service: ServiceConfig
  data: ServiceData
  onBarClick: (datum: LogsBarChartDatum) => void
  interval: IntervalKey
}

const ServiceRow = ({ service, data, onBarClick, interval }: ServiceRowProps) => {
  const { status } = getHealthStatus(data.errorRate, data.total)
  const statusLabel = getStatusLabel(status)
  const statusColor = getStatusColor(status)
  const { startLabel, endLabel } = getIntervalLabels(interval)

  const successRate = data.total > 0 ? ((data.total - data.errorCount - data.warningCount) / data.total) * 100 : 100

  return (
    <div className="py-6 border-b border-default last:border-b-0">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Link
            href={service.reportUrl || service.logsUrl}
            className="text-foreground font-medium hover:text-foreground-light transition-colors"
          >
            {service.name}
          </Link>
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="text-foreground-lighter hover:text-foreground-light transition-colors">
                <HelpCircle size={14} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="max-w-xs">
              <p>{SERVICE_DESCRIPTIONS[service.key as ServiceKey] || service.description}</p>
            </TooltipContent>
          </Tooltip>
        </div>
        <span className={cn('text-sm font-medium', statusColor)}>{statusLabel}</span>
      </div>

      <div className="flex items-end gap-px h-8">
        {data.isLoading ? (
          <div className="flex items-end gap-px h-full w-full">
            {Array.from({ length: 90 }).map((_, i) => (
              <div
                key={i}
                className="flex-1 h-full bg-surface-200 animate-pulse rounded-sm"
              />
            ))}
          </div>
        ) : data.eventChartData.length === 0 ? (
          <div className="flex items-end gap-px h-full w-full">
            {Array.from({ length: 90 }).map((_, i) => (
              <div
                key={i}
                className="flex-1 h-full bg-surface-300 rounded-sm"
              />
            ))}
          </div>
        ) : (
          data.eventChartData.map((datum, i) => {
            const barColor = getBarColor(datum, data.total)
            return (
              <Tooltip key={datum.timestamp || i}>
                <TooltipTrigger asChild>
                  <button
                    className={cn(
                      'flex-1 h-full rounded-sm transition-opacity hover:opacity-80',
                      barColor
                    )}
                    onClick={() => onBarClick(datum)}
                  />
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                  <div className="flex flex-col gap-1">
                    <span className="text-foreground-light">
                      {datum.timestamp ? new Date(datum.timestamp).toLocaleString() : 'Unknown'}
                    </span>
                    <span>
                      {getBarTotal(datum).toLocaleString()} requests
                    </span>
                    {datum.error_count > 0 && (
                      <span className="text-destructive">
                        {datum.error_count.toLocaleString()} errors
                      </span>
                    )}
                    {datum.warning_count > 0 && (
                      <span className="text-warning">
                        {datum.warning_count.toLocaleString()} warnings
                      </span>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>
            )
          })
        )}
      </div>

      <div className="flex items-center justify-between mt-2 text-xs text-foreground-lighter">
        <span>{startLabel}</span>
        <span>{data.total > 0 ? `${successRate.toFixed(2)} % success rate` : 'No data'}</span>
        <span>{endLabel}</span>
      </div>
    </div>
  )
}

export const ServiceHealthTable = ({
  services,
  serviceData,
  onBarClick,
  interval,
}: ServiceHealthTableProps) => {
  return (
    <div>
      <h2 className="mb-4">Project Health</h2>
      <div className="bg-surface-100 rounded-lg border border-default px-6">
        {services.map((service) => {
          const data = serviceData[service.key]
          if (!data) return null

          return (
            <ServiceRow
              key={service.key}
              service={service}
              data={data}
              onBarClick={onBarClick(service.key, service.logsUrl)}
              interval={interval}
            />
          )
        })}
      </div>
    </div>
  )
}
