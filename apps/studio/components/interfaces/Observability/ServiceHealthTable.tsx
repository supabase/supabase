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
  muted: 'bg-gray-500',
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
  if (data.total === 0) return 'No traffic'

  const errorRate = data.errorRate
  const warningRate = data.total > 0 ? (data.warningCount / data.total) * 100 : 0

  if (errorRate > 0) return `${formatPercent(errorRate)} errors`
  if (warningRate > 0) return `${formatPercent(warningRate)} warnings`
  return `${data.total.toLocaleString()} requests`
}

type ServiceCellProps = {
  service: ServiceConfig
  data: ServiceData
  onBarClick: (datum: LogsBarChartDatum) => void
  datetimeFormat: string
  className?: string
}

const ServiceCell = ({
  service,
  data,
  onBarClick,
  datetimeFormat,
  className,
}: ServiceCellProps) => {
  const reportUrl = service.reportUrl || service.logsUrl
  const { color } = getHealthStatus(data.errorRate, data.total)
  const description = SERVICE_DESCRIPTIONS[service.key] || service.description

  return (
    <Link
      href={reportUrl}
      className={cn('group block px-card py-4 hover:bg-surface-200 transition-colors', className)}
    >
      <span className="flex items-start justify-between mb-3 gap-2">
        <span className="flex items-center justify-between w-full">
          <span className="flex items-center gap-2 min-w-0">
            <span className="flex items-center gap-1.5 min-w-0">
              <span
                className={cn(
                  'w-2 h-2 rounded-full shrink-0',
                  colorClassMap[color] || 'bg-foreground'
                )}
              />
              <h3 className="text-foreground-light font-mono uppercase text-xs truncate">
                {service.name}
              </h3>
              {description && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={(e) => e.preventDefault()}
                      className="text-foreground-lighter hover:text-foreground-light transition-colors shrink-0"
                      aria-label={`About ${service.name}`}
                    >
                      <HelpCircle size={14} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs">
                    <p>{description}</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </span>
          </span>
          <span className="flex items-center gap-1.5">
            {data.isLoading ? (
              <Skeleton className="h-3 w-20 mt-0.5" />
            ) : (
              <span className="text-foreground text-xs tabular-nums truncate">
                {getSubtitle(data)}
              </span>
            )}
            <ChevronRight
              size={14}
              className="text-foreground-lighter group-hover:text-foreground transition-colors shrink-0 mt-0.5"
            />
          </span>
        </span>
      </span>

      <div className="h-14" onClick={(e) => e.preventDefault()}>
        <Loading isFullHeight active={data.isLoading}>
          {data.isLoading ? (
            <div className="h-full" />
          ) : (
            <LogsBarChart
              isFullHeight
              hideDateRange
              data={data.eventChartData}
              DateTimeFormat={datetimeFormat}
              onBarClick={onBarClick}
              EmptyState={null}
            />
          )}
        </Loading>
      </div>
    </Link>
  )
}

export const ServiceHealthTable = ({
  services,
  serviceData,
  onBarClick,
  datetimeFormat,
}: ServiceHealthTableProps) => {
  const total = services.length

  return (
    <div>
      <h2 className="heading-section mb-4">Service Health</h2>
      <Card>
        <CardContent className="p-0">
          <div className="grid grid-cols-1 md:grid-cols-2">
            {services.map((service, index) => {
              const data = serviceData[service.key]
              if (!data) return null

              const isLeftColumn = index % 2 === 0
              const isLastMobileRow = index === total - 1
              const isLastDesktopRow = index >= total - 2

              return (
                <ServiceCell
                  key={service.key}
                  service={service}
                  data={data}
                  onBarClick={onBarClick(service.logsUrl)}
                  datetimeFormat={datetimeFormat}
                  className={cn(
                    'border-default',
                    !isLastMobileRow && 'border-b',
                    isLastDesktopRow && 'md:border-b-0',
                    isLeftColumn && 'md:border-r'
                  )}
                />
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
