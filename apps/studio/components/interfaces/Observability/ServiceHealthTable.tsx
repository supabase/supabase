import { ChevronRight, HelpCircle } from 'lucide-react'
import Link from 'next/link'
import { useMemo } from 'react'
import type { ChartConfig } from 'ui'
import { Card, CardContent, Loading, Tooltip, TooltipContent, TooltipTrigger } from 'ui'
import { ChartLine } from 'ui-patterns/Chart'

import { ButtonTooltip } from '../../ui/ButtonTooltip'
import type { LogsBarChartDatum } from '../ProjectHome/ProjectUsage.metrics'
import type { ServiceKey } from './ObservabilityOverview.utils'

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
  onBarClick: (serviceKey: string, logsUrl: string) => (datum: { timestamp: string }) => void
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

type ServiceRowProps = {
  service: ServiceConfig
  data: ServiceData
  onBarClick: (datum: { timestamp: string }) => void
  datetimeFormat: string
}

const ServiceRow = ({ service, data, onBarClick, datetimeFormat }: ServiceRowProps) => {
  const errorRate = data.total > 0 ? data.errorRate : 0
  const warningRate = data.total > 0 ? (data.warningCount / data.total) * 100 : 0

  const reportUrl = service.reportUrl || service.logsUrl

  const rateData = useMemo(
    () =>
      data.eventChartData.map((d) => {
        const total = d.error_count + d.ok_count + d.warning_count
        return {
          timestamp: d.timestamp,
          ok_rate: total > 0 ? (d.ok_count / total) * 100 : 0,
          error_rate: total > 0 ? (d.error_count / total) * 100 : 0,
          warning_rate: total > 0 ? (d.warning_count / total) * 100 : 0,
        }
      }),
    [data.eventChartData]
  )

  const chartConfig: ChartConfig = {
    ok_rate: { label: 'Success rate', color: 'hsl(var(--brand-default))' },
    warning_rate: { label: 'Warning rate', color: 'hsl(var(--warning-default))' },
    error_rate: { label: 'Error rate', color: 'hsl(var(--destructive-default))' },
  }

  return (
    <Link
      href={reportUrl}
      className="block group py-4 px-card border-b border-default last:border-b-0 hover:bg-surface-200 transition-colors cursor-pointer"
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
        <Loading active={data.isLoading} isFullHeight>
          {data.isLoading ? (
            <div />
          ) : rateData.length === 0 ? (
            <div className="flex items-center justify-center h-full text-xs text-foreground-lighter">
              No data
            </div>
          ) : (
            <ChartLine
              data={rateData}
              dataKey="error_rate"
              dataKeys={['error_rate', 'warning_rate', 'ok_rate']}
              sharedStackId="stack"
              config={chartConfig}
              DateTimeFormat={datetimeFormat}
              onLineClick={onBarClick}
              YAxisProps={{ tickFormatter: (v: number) => `${v.toFixed(1)}%` }}
              className="h-full"
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
