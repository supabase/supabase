import { ChevronRight, HelpCircle } from 'lucide-react'
import Link from 'next/link'
import {
  Button,
  Card,
  CardContent,
  cn,
  Skeleton,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  type ChartConfig,
} from 'ui'
import { ChartEmptyState, ChartLoadingState } from 'ui-patterns/Chart'
import { LogsBarChart } from 'ui-patterns/LogsBarChart'

import type { LogsBarChartDatum } from '../ProjectHome/ProjectUsage.metrics'
import type { UnifiedLogType } from '../UnifiedLogs/UnifiedLogs.utils'
import { getHealthStatus, type ServiceKey } from './ObservabilityOverview.utils'

type ServiceConfig = {
  key: ServiceKey
  name: string
  description: string
  reportUrl?: string
  logType: UnifiedLogType
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
  onBarClick: (service: ServiceConfig) => (datum: LogsBarChartDatum) => void
  datetimeFormat: string
}

const colorClassMap: Record<string, string> = {
  muted: 'bg-gray-500',
  destructive: 'bg-destructive',
  warning: 'bg-warning',
  brand: 'bg-brand',
}

const LEVEL_CHART_CONFIG: ChartConfig = {
  error_count: { label: 'Errors' },
  warning_count: { label: 'Warnings' },
  ok_count: { label: 'Infos' },
}

const SERVICE_DESCRIPTIONS: Record<ServiceKey, string> = {
  db: 'PostgreSQL database health and performance',
  auth: 'Authentication and user management',
  functions: 'Serverless Edge Functions execution',
  storage: 'Object storage for files and assets',
  realtime: 'WebSocket connections and broadcasts',
  data_api: 'Incoming API requests routed through the edge network',
  postgrest: 'Auto-generated REST API for your database',
}

const formatPercent = (value: number) =>
  value >= 1 ? `${value.toFixed(1)}%` : `${value.toFixed(2)}%`

const getSubtitle = (data: ServiceData) => {
  if (data.total === 0) return ''

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
    <div
      className={cn(
        'group relative px-card pt-2 pb-4 hover:bg-surface-200 transition-colors',
        className
      )}
    >
      <div className="flex items-center justify-between mb-3 gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <div
            className={cn(
              'w-1.5 h-1.5 rounded-full shrink-0',
              colorClassMap[color] || 'bg-gray-500'
            )}
          />
          <h3 className="text-foreground-light font-mono uppercase text-xs truncate m-0">
            <Link
              href={reportUrl}
              className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-foreground-light focus-visible:after:ring-offset-2 focus-visible:after:rounded-sm"
            >
              {service.name}
            </Link>
          </h3>
          {description && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="relative z-10 text-foreground-lighter hover:text-foreground-light transition-colors shrink-0"
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
        <div className="flex items-center gap-1.5">
          {data.isLoading ? (
            <Skeleton className="h-3 w-20 mt-0.5" />
          ) : (
            <span
              className={cn(
                'text-xs truncate',
                data.total === 0 ? 'text-foreground-lighter' : 'text-foreground'
              )}
            >
              {getSubtitle(data)}
            </span>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="text"
                size="tiny"
                className="relative z-10 px-1 text-foreground-lighter group-hover:text-foreground transition-colors shrink-0"
                aria-label={`Go to ${service.name} report`}
                asChild
              >
                <Link href={reportUrl}>
                  <ChevronRight size={14} strokeWidth={1.5} />
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">Go to {service.name} report</TooltipContent>
          </Tooltip>
        </div>
      </div>

      <div className="relative z-10 h-16">
        {data.isLoading ? (
          <ChartLoadingState className="h-full" />
        ) : (
          <LogsBarChart
            isFullHeight
            hideDateRange
            hideXAxis
            data={data.eventChartData}
            chartConfig={LEVEL_CHART_CONFIG}
            DateTimeFormat={datetimeFormat}
            onBarClick={onBarClick}
            EmptyState={<ChartEmptyState className="h-full" description="No traffic" />}
          />
        )}
      </div>
    </div>
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
      <Card className="overflow-auto">
        <CardContent className="p-0">
          <div className="grid grid-cols-1 md:grid-cols-2">
            {services.map((service, index) => {
              const data = serviceData[service.key]
              if (!data) return null

              const isFirst = index === 0
              const isLeftColumn = !isFirst && (index - 1) % 2 === 0
              const restCount = services.length - 1
              const lastRowCount = restCount % 2 === 0 ? 2 : 1
              const isInLastRow = !isFirst && index >= services.length - lastRowCount

              return (
                <ServiceCell
                  key={service.key}
                  service={service}
                  data={data}
                  onBarClick={onBarClick(service)}
                  datetimeFormat={datetimeFormat}
                  className={cn(
                    'border-default border-b',
                    isFirst && 'md:col-span-2',
                    isInLastRow && 'md:border-b-0',
                    isLeftColumn && 'md:border-r'
                  )}
                />
              )
            })}
            <div className="bg-background/20" aria-hidden="true" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
