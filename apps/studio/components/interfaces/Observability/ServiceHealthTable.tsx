import { HelpCircle } from 'lucide-react'
import { ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { Card, CardContent } from 'ui'
import { Badge, Loading, Tooltip, TooltipContent, TooltipTrigger } from 'ui'
import { LogsBarChart } from 'ui-patterns/LogsBarChart'

import { ButtonTooltip } from '../../ui/ButtonTooltip'
import type { LogsBarChartDatum } from '../HomeNew/ProjectUsage.metrics'
import { type ServiceKey, getHealthStatus } from './ObservabilityOverview.utils'

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
  datetimeFormat: string
}

const SERVICE_DESCRIPTIONS: Record<ServiceKey, string> = {
  db: 'PostgreSQL database health and performance',
  auth: 'Authentication and user management',
  functions: 'Serverless Edge Functions execution',
  storage: 'Object storage for files and assets',
  realtime: 'WebSocket connections and broadcasts',
  postgrest: 'Auto-generated REST API for your database',
}

const getStatusLabel = (status: 'healthy' | 'error' | 'unknown'): string => {
  switch (status) {
    case 'healthy':
      return 'Healthy'
    case 'error':
      return 'Unhealthy'
    case 'unknown':
      return 'Unknown'
  }
}

const getStatusTooltip = (status: 'healthy' | 'error' | 'unknown'): string => {
  switch (status) {
    case 'healthy':
      return 'Error rate is below 1%'
    case 'error':
      return 'Error rate is 1% or higher'
    case 'unknown':
      return 'Insufficient data (fewer than 100 requests)'
  }
}

const getStatusVariant = (
  status: 'healthy' | 'error' | 'unknown'
): 'success' | 'warning' | 'destructive' | 'default' => {
  switch (status) {
    case 'healthy':
      return 'success'
    case 'error':
      return 'destructive'
    case 'unknown':
      return 'default'
  }
}

type ServiceRowProps = {
  service: ServiceConfig
  data: ServiceData
  onBarClick: (datum: LogsBarChartDatum) => void
  datetimeFormat: string
}

const ServiceRow = ({ service, data, onBarClick, datetimeFormat }: ServiceRowProps) => {
  const { status } = getHealthStatus(data.errorRate, data.total)
  const statusLabel = getStatusLabel(status)
  const statusVariant = getStatusVariant(status)
  const statusTooltip = getStatusTooltip(status)

  const errorRate = data.total > 0 ? data.errorRate : 0
  const warningRate = data.total > 0 ? (data.warningCount / data.total) * 100 : 0

  const reportUrl = service.reportUrl || service.logsUrl

  return (
    <Link
      href={reportUrl}
      className="block group p-4 border-b border-default last:border-b-0 hover:bg-surface-200 transition-colors cursor-pointer"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-foreground font-medium">{service.name}</span>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={(e) => e.preventDefault()}
                className="text-foreground-lighter hover:text-foreground-light transition-colors"
              >
                <HelpCircle size={14} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="max-w-xs">
              <p>{SERVICE_DESCRIPTIONS[service.key as ServiceKey] || service.description}</p>
            </TooltipContent>
          </Tooltip>
        </div>
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant={statusVariant}>{statusLabel}</Badge>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>{statusTooltip}</p>
            </TooltipContent>
          </Tooltip>
          <ButtonTooltip
            type="text"
            size="tiny"
            className="p-1.5"
            tooltip={{ content: { text: `Go to ${service.name} report` } }}
          >
            <ChevronRight
              size={14}
              className="text-foreground-lighter group-hover:text-foreground"
            />
          </ButtonTooltip>
        </div>
      </div>

      <div className="h-16" onClick={(e) => e.preventDefault()}>
        <Loading active={data.isLoading}>
          {data.isLoading ? (
            <div />
          ) : (
            <LogsBarChart
              data={data.eventChartData}
              DateTimeFormat={datetimeFormat}
              onBarClick={onBarClick}
              EmptyState={
                <div className="flex items-center justify-center h-full text-xs text-foreground-lighter">
                  No data
                </div>
              }
            />
          )}
        </Loading>
      </div>

      {data.total > 0 && (
        <div className="flex items-center justify-center mt-2 text-xs text-foreground-lighter gap-4 font-mono tabular-nums tracking-tight">
          {errorRate > 0 && (
            <span className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-destructive" />
              {errorRate.toFixed(2)}% errors
            </span>
          )}
          {warningRate > 0 && (
            <span className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-warning" />
              {warningRate.toFixed(2)}% warnings
            </span>
          )}
          {errorRate === 0 && warningRate === 0 && (
            <span className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-brand" />
              0% errors
            </span>
          )}
        </div>
      )}
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
                onBarClick={onBarClick(service.key, service.logsUrl)}
                datetimeFormat={datetimeFormat}
              />
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
}
