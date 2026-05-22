import { ChevronRight, HelpCircle } from 'lucide-react'
import Link from 'next/link'
import {
  Card,
  CardContent,
  cn,
  Loading,
  Skeleton,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from 'ui'
import { LogsBarChart } from 'ui-patterns/LogsBarChart'

import type { LogsBarChartDatum } from '../ProjectHome/ProjectUsage.metrics'
import { getHealthStatus, type ServiceKey } from './ObservabilityOverview.utils'

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

export type ServiceHealthTableProps = {
  services: ServiceConfig[]
  serviceData: Record<string, ServiceData>
  onBarClick: (logsUrl: string) => (datum: LogsBarChartDatum) => void
  datetimeFormat: string
}

const colorClassMap: Record<string, string> = {
  muted: 'bg-muted',
  destructive: 'bg-destructive',
  warning: 'bg-warning',
  brand: 'bg-brand',
}

const SERVICE_DESCRIPTIONS: Record<ServiceKey, string> = {
  db: 'PostgreSQL database health and performance',
  auth: 'Authentication and user management',
  functions: 'Serverless Edge Functions execution',
  storage: 'Object storage for files and assets',
  realtime: 'WebSocket connections and broadcasts',
  postgrest: 'Auto-generated REST API for your database',
}

const formatPercent = (value: number) =>
  value >= 1 ? `${value.toFixed(1)}%` : `${value.toFixed(2)}%`

const getSubtitle = (data: ServiceData) => {
  if (data.isLoading) return ''
  if (data.total === 0) return 'No traffic'

  const errorRate = data.errorRate
  const warningRate = data.total > 0 ? (data.warningCount / data.total) * 100 : 0

  if (errorRate > 0) return `${formatPercent(errorRate)} errors`
  if (warningRate > 0) return `${formatPercent(warningRate)} warnings`
  return `${data.total.toLocaleString()} requests`
}

type ServiceRowProps = {
  service: ServiceConfig
  data: ServiceData
  onBarClick: (datum: LogsBarChartDatum) => void
  datetimeFormat: string
}

const ServiceRow = ({ service, data, onBarClick, datetimeFormat }: ServiceRowProps) => {
  const reportUrl = service.reportUrl || service.logsUrl
  const { color } = getHealthStatus(data.errorRate, data.total)
  const subtitle = getSubtitle(data)
  const description = SERVICE_DESCRIPTIONS[service.key] || service.description

  return (
    <Link
      href={reportUrl}
      className="group flex items-center gap-4 px-card py-3 border-b border-default last:border-b-0 hover:bg-surface-200 transition-colors"
    >
      <div className="flex items-center gap-3 w-48 shrink-0 min-w-0">
        <div
          className={cn('w-1.5 h-1.5 rounded-full shrink-0', colorClassMap[color] || 'bg-muted')}
        />
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-foreground text-sm font-medium truncate">{service.name}</span>
            {description && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={(e) => e.preventDefault()}
                    className="text-foreground-lighter hover:text-foreground-light transition-colors shrink-0"
                    aria-label={`About ${service.name}`}
                  >
                    <HelpCircle size={12} />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  <p>{description}</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
          {data.isLoading ? (
            <Skeleton className="h-3 w-20 mt-0.5" />
          ) : (
            <span className="text-foreground-lighter text-xs truncate">{subtitle}</span>
          )}
        </div>
      </div>

      <div className="flex-1 h-12 min-w-0" onClick={(e) => e.preventDefault()}>
        <Loading isFullHeight active={data.isLoading}>
          {data.isLoading ? (
            <div className="h-full" />
          ) : (
            <LogsBarChart
              isFullHeight
              hideDateRange
              data={data.total === 0 ? [] : data.eventChartData}
              DateTimeFormat={datetimeFormat}
              onBarClick={onBarClick}
              EmptyState={null}
            />
          )}
        </Loading>
      </div>

      <ChevronRight
        size={14}
        className="text-foreground-lighter group-hover:text-foreground transition-colors shrink-0"
      />
    </Link>
  )
}

export const ServiceHealthTable = ({
  services,
  serviceData,
  onBarClick,
  datetimeFormat,
}: ServiceHealthTableProps) => {
  return (
    <div>
      <h2 className="heading-section mb-4">Service Health</h2>
      <Card>
        <CardContent className="p-0">
          {services.map((service) => {
            const data = serviceData[service.key]
            if (!data) return null

            return (
              <ServiceRow
                key={service.key}
                service={service}
                data={data}
                onBarClick={onBarClick(service.logsUrl)}
                datetimeFormat={datetimeFormat}
              />
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
}
