import { useParams } from 'common'
import NoDataPlaceholder from 'components/ui/Charts/NoDataPlaceholder'
import { useInfraMonitoringAttributesQuery } from 'data/analytics/infra-monitoring-query'
import { useMaxConnectionsQuery } from 'data/database/max-connections-query'
import dayjs from 'dayjs'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { Info } from 'lucide-react'
import { useMemo } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Loading,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  cn,
} from 'ui'
import { LogsBarChart } from 'ui-patterns/LogsBarChart'

import type { LogsBarChartDatum } from '../HomeNew/ProjectUsage.metrics'
import {
  getMetricStatusColor,
  parseConnectionsData,
  parseInfrastructureMetrics,
} from './DatabaseInfrastructureSection.utils'

type DatabaseInfrastructureSectionProps = {
  interval: '1hr' | '1day' | '7day'
  refreshKey: number
  dbErrorRate: number
  dbChartData: LogsBarChartDatum[]
  dbErrorCount: number
  dbWarningCount: number
  isLoading: boolean
  onBarClick: (datum: unknown) => void
  datetimeFormat: string
}

export const DatabaseInfrastructureSection = ({
  interval,
  refreshKey,
  dbErrorRate,
  dbChartData,
  dbErrorCount,
  dbWarningCount,
  isLoading: dbLoading,
  onBarClick,
  datetimeFormat,
}: DatabaseInfrastructureSectionProps) => {
  const { ref: projectRef } = useParams()
  const { data: project } = useSelectedProjectQuery()

  // refreshKey forces date recalculation when user clicks refresh button
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const { startDate, endDate, infraInterval } = useMemo(() => {
    const now = dayjs()
    const end = now.toISOString()
    let start: string
    let infraInterval: '1h' | '1d'

    switch (interval) {
      case '1hr':
        start = now.subtract(1, 'hour').toISOString()
        infraInterval = '1h'
        break
      case '1day':
        start = now.subtract(1, 'day').toISOString()
        infraInterval = '1h'
        break
      case '7day':
        start = now.subtract(7, 'day').toISOString()
        infraInterval = '1d'
        break
      default:
        start = now.subtract(1, 'hour').toISOString()
        infraInterval = '1h'
    }

    return { startDate: start, endDate: end, infraInterval }
  }, [interval, refreshKey])

  const {
    data: infraData,
    isLoading: infraLoading,
    error: infraError,
  } = useInfraMonitoringAttributesQuery({
    projectRef,
    attributes: [
      'avg_cpu_usage',
      'ram_usage',
      'disk_io_consumption',
      'pg_stat_database_num_backends',
    ],
    startDate,
    endDate,
    interval: infraInterval,
  })

  const { data: maxConnectionsData } = useMaxConnectionsQuery({
    projectRef,
    connectionString: project?.connectionString,
  })

  const metrics = useMemo(() => parseInfrastructureMetrics(infraData), [infraData])

  const connections = useMemo(
    () => parseConnectionsData(infraData, maxConnectionsData),
    [infraData, maxConnectionsData]
  )

  const errorMessage =
    infraError && typeof infraError === 'object' && 'message' in infraError
      ? String(infraError.message)
      : 'Error loading data'

  return (
    <div>
      <h2 className="mb-4">Database</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="flex flex-col min-h-[200px]">
          <CardHeader className="pb-0">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-foreground-light text-sm font-medium">
                  Error Rate
                </CardTitle>
                <div className="text-foreground text-3xl mt-2">{dbErrorRate.toFixed(1)}%</div>
              </div>
              <div className="flex items-end gap-4 text-foreground-light">
                <div className="flex flex-col items-end">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-warning rounded-full" />
                    <span className="text-xs">Warn</span>
                  </div>
                  <span className="text-foreground text-lg">{dbWarningCount.toLocaleString()}</span>
                </div>
                <div className="flex flex-col items-end">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-destructive rounded-full" />
                    <span className="text-xs">Err</span>
                  </div>
                  <span className="text-foreground text-lg">{dbErrorCount.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1 pt-4 overflow-hidden max-h-[200px]">
            <Loading isFullHeight active={dbLoading}>
              <LogsBarChart
                isFullHeight
                data={dbChartData}
                DateTimeFormat={datetimeFormat}
                onBarClick={onBarClick}
                EmptyState={
                  <NoDataPlaceholder
                    size="small"
                    message="No data for selected period"
                    isFullHeight
                  />
                }
              />
            </Loading>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-4">
          <Card className="min-h-[120px] flex flex-col justify-between">
            <CardHeader className="pb-2">
              <CardTitle className="text-foreground-light text-xs font-medium flex items-center gap-1">
                Disk
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="w-3 h-3 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p>
                      Disk I/O consumption percentage. High values may indicate disk bottlenecks.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {infraLoading ? (
                <div className="text-2xl text-foreground-light">...</div>
              ) : infraError ? (
                <div className="text-xs text-destructive break-words">{errorMessage}</div>
              ) : metrics ? (
                <div
                  className={cn(
                    'text-3xl text-foreground',
                    getMetricStatusColor(metrics.disk.current)
                  )}
                >
                  {metrics.disk.current.toFixed(0)}%
                </div>
              ) : (
                <div className="text-3xl text-foreground-light">--</div>
              )}
            </CardContent>
          </Card>

          <Card className="min-h-[120px] flex flex-col justify-between">
            <CardHeader className="pb-2">
              <CardTitle className="text-foreground-light text-xs font-medium flex items-center gap-1">
                Memory
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="w-3 h-3 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p>RAM usage percentage. Sustained high usage may indicate memory pressure.</p>
                  </TooltipContent>
                </Tooltip>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {infraLoading ? (
                <div className="text-2xl text-foreground-light">...</div>
              ) : infraError ? (
                <div className="text-xs text-destructive break-words">{errorMessage}</div>
              ) : metrics ? (
                <div
                  className={cn(
                    'text-3xl text-foreground',
                    getMetricStatusColor(metrics.ram.current)
                  )}
                >
                  {metrics.ram.current.toFixed(0)}%
                </div>
              ) : (
                <div className="text-3xl text-foreground-light">--</div>
              )}
            </CardContent>
          </Card>

          <Card className="min-h-[120px] flex flex-col justify-between">
            <CardHeader className="pb-2">
              <CardTitle className="text-foreground-light text-xs font-medium flex items-center gap-1">
                CPU
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="w-3 h-3 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p>
                      CPU usage percentage. High values may suggest CPU-intensive queries or
                      workloads.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {infraLoading ? (
                <div className="text-2xl text-foreground-light">...</div>
              ) : infraError ? (
                <div className="text-xs text-destructive break-words">{errorMessage}</div>
              ) : metrics ? (
                <div
                  className={cn(
                    'text-3xl text-foreground',
                    getMetricStatusColor(metrics.cpu.current)
                  )}
                >
                  {metrics.cpu.current.toFixed(0)}%
                </div>
              ) : (
                <div className="text-3xl text-foreground-light">--</div>
              )}
            </CardContent>
          </Card>

          <Card className="min-h-[120px] flex flex-col justify-between">
            <CardHeader className="pb-2">
              <CardTitle className="text-foreground-light text-xs font-medium flex items-center gap-1">
                Connections
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="w-3 h-3 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p>
                      Active database connections (current/max). Monitor to avoid connection
                      exhaustion.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {infraLoading ? (
                <div className="text-2xl text-foreground-light">...</div>
              ) : infraError ? (
                <div className="text-xs text-destructive break-words">{errorMessage}</div>
              ) : connections.max > 0 ? (
                <div
                  className={cn(
                    'text-2xl text-foreground',
                    getMetricStatusColor((connections.current / connections.max) * 100)
                  )}
                >
                  {connections.current}/{connections.max}
                </div>
              ) : (
                <div className="text-3xl text-foreground-light">--</div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
