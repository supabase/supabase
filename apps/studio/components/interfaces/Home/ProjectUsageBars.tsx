import { useMemo } from 'react'
import dayjs from 'dayjs'
import { WifiOff } from 'lucide-react'

import { useParams } from 'common'
import { useDiskUtilizationQuery } from 'data/config/disk-utilization-query'
import { useInfraMonitoringQuery } from 'data/analytics/infra-monitoring-query'
import { GB } from 'lib/constants'
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider, cn } from 'ui'
import ShimmeringLoader from 'components/ui/ShimmeringLoader'

interface UsageBarProps {
  label: string
  usage: number | undefined // Percentage
  limit?: number // Upper limit for the bar (e.g., 100)
  unit?: string
  isLoading: boolean
  error: Error | null
  warningThreshold?: number
  dangerThreshold?: number
  className?: string
}

const UsageBar = ({
  label,
  usage,
  limit = 100,
  unit = '%',
  isLoading,
  error,
  warningThreshold = 75,
  dangerThreshold = 90,
  className,
}: UsageBarProps) => {
  const usagePercentage = usage !== undefined ? Math.min(Math.max(usage, 0), limit) : 0
  const barWidth = `${(usagePercentage / limit) * 100}%`

  let barColor = 'bg-foreground-lighter' // Default/healthy color
  if (usage !== undefined) {
    if (usage >= dangerThreshold) {
      barColor = 'bg-destructive'
    } else if (usage >= warningThreshold) {
      barColor = 'bg-warning'
    }
  }

  const displayValue = usage !== undefined ? `${usage.toFixed(0)}${unit}` : '--'

  return (
    <TooltipProvider>
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          <div className={cn('flex items-center gap-4 w-48 cursor-default', className)}>
            <span className="text-xs text-foreground-light w-10 text-right shrink-0">{label}</span>
            <div className="relative w-full h-1.5 bg-surface-300 rounded-full overflow-hidden">
              {isLoading && (
                <ShimmeringLoader className="absolute inset-0 h-full w-full rounded-full !bg-surface-300" />
              )}
              {!isLoading && !error && (
                <div
                  className={cn('absolute left-0 top-0 h-full rounded-full', barColor)}
                  style={{ width: barWidth }}
                />
              )}
              {!isLoading && error && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <WifiOff size={10} strokeWidth={1.5} className="text-destructive" />
                </div>
              )}
            </div>
            <span className="text-xs font-mono w-8 text-right">
              {isLoading ? '...' : displayValue}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          {isLoading
            ? `Loading ${label} usage...`
            : error
              ? `Failed to load ${label} usage: ${error.message}`
              : `${label} Usage: ${usage !== undefined ? `${usage.toFixed(2)}${unit}` : 'N/A'}`}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

interface ProjectUsageBarsProps {
  projectRef: string | undefined
}

export const ProjectUsageBars = ({ projectRef }: ProjectUsageBarsProps) => {
  const interval = '1h'
  const now = dayjs()
  // Fetch data slightly further back to ensure data points are available
  const startDate = now.subtract(2, 'hour').toISOString().slice(0, -5) + 'Z'
  const endDate = now.toISOString().slice(0, -5) + 'Z'
  const dateFormat = 'YYYY-MM-DDTHH:mm:ssZ' // Not really used for display, but needed for query

  // Disk Size Usage
  const {
    data: diskUtil,
    error: diskUtilError,
    isLoading: isLoadingDiskUtil,
  } = useDiskUtilizationQuery(
    { projectRef },
    {
      enabled: !!projectRef,
      // Refetch relatively frequently as disk usage can change
      refetchInterval: 5 * 60 * 1000, // 5 minutes
    }
  )
  const diskUsagePercent = useMemo(() => {
    if (!diskUtil) return undefined
    const { metrics } = diskUtil
    const used = metrics?.fs_used_bytes ?? 0
    // Use fs_size_bytes for the total size
    const total = metrics?.fs_size_bytes ?? 0
    return total > 0 ? (used / total) * 100 : 0
  }, [diskUtil])

  // CPU Usage
  const {
    data: cpuUsageData,
    error: cpuUsageError,
    isLoading: isLoadingCpuUsage,
  } = useInfraMonitoringQuery(
    {
      projectRef,
      attribute: 'max_cpu_usage',
      interval,
      startDate,
      endDate,
      dateFormat,
    },
    {
      enabled: !!projectRef,
      // Refetch relatively frequently
      refetchInterval: 5 * 60 * 1000, // 5 minutes
    }
  )
  const latestCpuUsage = useMemo(
    () => cpuUsageData?.data?.slice(-1)?.[0]?.max_cpu_usage,
    [cpuUsageData]
  )

  // Memory Usage
  const {
    data: memoryUsageData,
    error: memoryUsageError,
    isLoading: isLoadingMemoryUsage,
  } = useInfraMonitoringQuery(
    {
      projectRef,
      attribute: 'ram_usage',
      interval,
      startDate,
      endDate,
      dateFormat,
    },
    {
      enabled: !!projectRef,
      // Refetch relatively frequently
      refetchInterval: 5 * 60 * 1000, // 5 minutes
    }
  )
  const latestMemoryUsage = useMemo(
    () => memoryUsageData?.data?.slice(-1)?.[0]?.ram_usage,
    [memoryUsageData]
  )

  // Disk IO Usage (Budget Consumption)
  const {
    data: ioBudgetData,
    error: ioBudgetError,
    isLoading: isLoadingIoBudget,
  } = useInfraMonitoringQuery(
    {
      projectRef,
      attribute: 'disk_io_consumption',
      interval,
      startDate,
      endDate,
      dateFormat,
    },
    {
      enabled: !!projectRef,
      // Refetch relatively frequently
      refetchInterval: 5 * 60 * 1000, // 5 minutes
    }
  )
  const latestIoBudgetUsage = useMemo(
    () => ioBudgetData?.data?.slice(-1)?.[0]?.disk_io_consumption,
    [ioBudgetData]
  )

  if (!projectRef) return null // Don't render if projectRef is missing

  return (
    <div className="flex flex-col gap-1.5">
      <UsageBar
        label="Disk"
        usage={diskUsagePercent}
        isLoading={isLoadingDiskUtil}
        error={diskUtilError as Error | null}
        warningThreshold={80} // Adjusted thresholds for disk
        dangerThreshold={95}
      />
      <UsageBar
        label="Memory"
        usage={latestMemoryUsage ? Number(latestMemoryUsage) : undefined}
        isLoading={isLoadingMemoryUsage}
        error={memoryUsageError as Error | null}
      />
      <UsageBar
        label="CPU"
        usage={latestCpuUsage ? Number(latestCpuUsage) : undefined}
        isLoading={isLoadingCpuUsage}
        error={cpuUsageError as Error | null}
      />
      <UsageBar
        label="IO"
        usage={latestIoBudgetUsage ? Number(latestIoBudgetUsage) : undefined}
        isLoading={isLoadingIoBudget}
        error={ioBudgetError as Error | null}
      />
    </div>
  )
}
