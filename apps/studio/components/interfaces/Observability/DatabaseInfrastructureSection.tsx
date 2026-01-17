import dayjs from 'dayjs'
import { useMemo } from 'react'
import { Info } from 'lucide-react'
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
import NoDataPlaceholder from 'components/ui/Charts/NoDataPlaceholder'
import { useInfraMonitoringAttributesQuery } from 'data/analytics/infra-monitoring-query'
import { useMaxConnectionsQuery } from 'data/database/max-connections-query'
import { useParams } from 'common'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import type { ChartIntervals } from 'types'
import type { LogsBarChartDatum } from '../HomeNew/ProjectUsage.metrics'

type DatabaseInfrastructureSectionProps = {
  interval: '1hr' | '1day' | '7day'
  selectedInterval: ChartIntervals
  dbErrorRate: number
  dbChartData: LogsBarChartDatum[]
  dbTotal: number
  dbErrorCount: number
  dbWarningCount: number
  isLoading: boolean
  onBarClick: (datum: any) => void
  datetimeFormat: string
}

export const DatabaseInfrastructureSection = ({
  interval,
  selectedInterval,
  dbErrorRate,
  dbChartData,
  dbTotal,
  dbErrorCount,
  dbWarningCount,
  isLoading: dbLoading,
  onBarClick,
  datetimeFormat,
}: DatabaseInfrastructureSectionProps) => {
  const { ref: projectRef } = useParams()
  const { data: project } = useSelectedProjectQuery()

  // Calculate date range and map interval to infrastructure API format
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
  }, [interval])

  // Fetch infrastructure metrics
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

  console.log('[DatabaseInfra] Query state:', { infraLoading, infraError, hasData: !!infraData })

  // Fetch max connections
  const { data: maxConnectionsData } = useMaxConnectionsQuery({
    projectRef,
    connectionString: project?.connectionString,
  })

  // Parse metrics data
  const metrics = useMemo(() => {
    if (!infraData) {
      console.log('[DatabaseInfra] No infraData')
      return null
    }

    console.log('[DatabaseInfra] infraData:', infraData)

    // Handle multi-attribute response format
    const multiData = infraData as any
    const series = multiData.series || {}

    console.log('[DatabaseInfra] series:', series)

    // Parse values, handling both number and string formats
    const parseCpuValue = (val: any) => {
      if (typeof val === 'number') return val
      if (typeof val === 'string') return parseFloat(val) || 0
      return 0
    }

    const cpuValue = parseCpuValue(series.avg_cpu_usage?.totalAverage)
    const ramValue = parseCpuValue(series.ram_usage?.totalAverage)
    const diskValue = parseCpuValue(series.disk_io_consumption?.totalAverage)

    console.log('[DatabaseInfra] parsed values:', { cpuValue, ramValue, diskValue })

    return {
      cpu: {
        current: cpuValue,
        max: 100,
      },
      ram: {
        current: ramValue,
        max: 100,
      },
      disk: {
        current: diskValue,
        max: 100,
      },
    }
  }, [infraData])

  const connections = useMemo(() => {
    console.log('[DatabaseInfra] maxConnectionsData:', maxConnectionsData)

    if (!infraData || !maxConnectionsData) {
      console.log('[DatabaseInfra] Missing infraData or maxConnectionsData')
      return { current: 0, max: 0 }
    }

    const multiData = infraData as any
    const series = multiData.series || {}

    // Get average connection count from the time series
    const currentVal = series.pg_stat_database_num_backends?.totalAverage
    const current = Math.round(
      typeof currentVal === 'string' ? parseFloat(currentVal) || 0 : currentVal || 0
    )
    const max = maxConnectionsData.maxConnections || 0

    console.log('[DatabaseInfra] connections:', { current, max, currentVal })

    return { current, max }
  }, [infraData, maxConnectionsData])

  const getStatusColor = (percentage: number) => {
    if (percentage >= 90) return 'text-destructive'
    if (percentage >= 70) return 'text-warning'
    return 'text-brand'
  }

  return (
    <div>
      <h2 className="mb-4">Database</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left: Error Rate Chart (50% width) */}
        <Card className="flex flex-col min-h-[200px]">
          <CardHeader className="pb-0">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-foreground-light text-sm font-medium">
                  Error Rate
                </CardTitle>
                <div className="text-foreground text-3xl mt-2">
                  {dbErrorRate.toFixed(1)}%
                </div>
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

        {/* Right: 2x2 Grid of Metrics */}
        <div className="grid grid-cols-2 gap-4">
          {/* Disk */}
          <Card className="min-h-[120px] flex flex-col justify-between">
            <CardHeader className="pb-2">
              <CardTitle className="text-foreground-light text-xs font-medium flex items-center gap-1">
                Disk
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="w-3 h-3 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p>Disk I/O consumption percentage. High values may indicate disk bottlenecks.</p>
                  </TooltipContent>
                </Tooltip>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {infraLoading ? (
                <div className="text-2xl text-foreground-light">...</div>
              ) : infraError ? (
                <div className="text-xs text-destructive break-words">
                  {infraError.message || 'Error loading data'}
                </div>
              ) : metrics ? (
                <div className={cn('text-3xl text-foreground', getStatusColor(metrics.disk.current))}>
                  {metrics.disk.current.toFixed(0)}%
                </div>
              ) : (
                <div className="text-3xl text-foreground-light">--</div>
              )}
            </CardContent>
          </Card>

          {/* Memory */}
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
                <div className="text-xs text-destructive break-words">
                  {infraError.message || 'Error loading data'}
                </div>
              ) : metrics ? (
                <div className={cn('text-3xl text-foreground', getStatusColor(metrics.ram.current))}>
                  {metrics.ram.current.toFixed(0)}%
                </div>
              ) : (
                <div className="text-3xl text-foreground-light">--</div>
              )}
            </CardContent>
          </Card>

          {/* CPU */}
          <Card className="min-h-[120px] flex flex-col justify-between">
            <CardHeader className="pb-2">
              <CardTitle className="text-foreground-light text-xs font-medium flex items-center gap-1">
                CPU
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="w-3 h-3 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p>CPU usage percentage. High values may suggest CPU-intensive queries or workloads.</p>
                  </TooltipContent>
                </Tooltip>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {infraLoading ? (
                <div className="text-2xl text-foreground-light">...</div>
              ) : infraError ? (
                <div className="text-xs text-destructive break-words">
                  {infraError.message || 'Error loading data'}
                </div>
              ) : metrics ? (
                <div className={cn('text-3xl text-foreground', getStatusColor(metrics.cpu.current))}>
                  {metrics.cpu.current.toFixed(0)}%
                </div>
              ) : (
                <div className="text-3xl text-foreground-light">--</div>
              )}
            </CardContent>
          </Card>

          {/* Connections */}
          <Card className="min-h-[120px] flex flex-col justify-between">
            <CardHeader className="pb-2">
              <CardTitle className="text-foreground-light text-xs font-medium flex items-center gap-1">
                Connections
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="w-3 h-3 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p>Active database connections (current/max). Monitor to avoid connection exhaustion.</p>
                  </TooltipContent>
                </Tooltip>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {infraLoading ? (
                <div className="text-2xl text-foreground-light">...</div>
              ) : infraError ? (
                <div className="text-xs text-destructive break-words">
                  {infraError.message || 'Error loading data'}
                </div>
              ) : connections.max > 0 ? (
                <div
                  className={cn(
                    'text-2xl text-foreground',
                    getStatusColor((connections.current / connections.max) * 100)
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
