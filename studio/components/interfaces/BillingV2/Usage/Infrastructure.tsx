import { useParams } from 'common'
import ShimmeringLoader from 'components/ui/ShimmeringLoader'
import { useInfraMonitoringQuery } from 'data/analytics/infra-monitoring-query'
import { useProjectSubscriptionQuery } from 'data/subscriptions/project-subscription-query'
import BarChart from './BarChart'
import SectionContent from './SectionContent'
import SectionHeader from './SectionHeader'

const Infrastructure = () => {
  const { ref } = useParams()
  const { data: subscription } = useProjectSubscriptionQuery({ projectRef: ref })
  const { current_period_start, current_period_end } = subscription?.billing ?? {}
  const startDate = new Date((current_period_start ?? 0) * 1000).toISOString()
  const endDate = new Date((current_period_end ?? 0) * 1000).toISOString()

  const CPU_USAGE_KEY = 'cpu_usage'
  const { data: cpuUsageData, isLoading: isLoadingCpuUsageData } = useInfraMonitoringQuery({
    projectRef: ref,
    attribute: CPU_USAGE_KEY,
    interval: '1d',
    startDate,
    endDate,
  })

  const MEMORY_USAGE_KEY = 'ram_usage'
  const { data: memoryUsageData, isLoading: isLoadingMemoryUsageData } = useInfraMonitoringQuery({
    projectRef: ref,
    attribute: MEMORY_USAGE_KEY,
    interval: '1d',
    startDate,
    endDate,
  })

  const DISK_IO_BUDGET_KEY = 'disk_io_budget'
  const { data: ioBudgetData, isLoading: isLoadingIoBudgetData } = useInfraMonitoringQuery({
    projectRef: ref,
    attribute: DISK_IO_BUDGET_KEY,
    interval: '1d',
    startDate,
    endDate,
  })

  return (
    <>
      <SectionHeader title="Infrastructure" description="Some description here" />

      <SectionContent title="CPU" description="Some description here">
        <div className="space-y-1">
          <p>Max CPU usage each day</p>
          <p className="text-sm text-scale-1000">Some description here</p>
        </div>
        {isLoadingCpuUsageData ? (
          <div className="space-y-2">
            <ShimmeringLoader />
            <ShimmeringLoader className="w-3/4" />
            <ShimmeringLoader className="w-1/2" />
          </div>
        ) : (
          <BarChart
            attribute={CPU_USAGE_KEY}
            data={cpuUsageData?.data ?? []}
            unit={cpuUsageData?.format}
            yLimit={100}
          />
        )}
      </SectionContent>

      <SectionContent title="Memory" description="Some description here">
        <div className="space-y-1">
          <p>Max memory usage each day</p>
          <p className="text-sm text-scale-1000">Some description here</p>
        </div>
        {isLoadingMemoryUsageData ? (
          <div className="space-y-2">
            <ShimmeringLoader />
            <ShimmeringLoader className="w-3/4" />
            <ShimmeringLoader className="w-1/2" />
          </div>
        ) : (
          <BarChart
            attribute={MEMORY_USAGE_KEY}
            data={memoryUsageData?.data ?? []}
            unit={memoryUsageData?.format}
            yLimit={100}
          />
        )}
      </SectionContent>

      <SectionContent title="IO Budget" description="Some description here">
        <div className="space-y-1">
          <p>Disk IO budget per day</p>
          <p className="text-sm text-scale-1000">Some description here</p>
        </div>
        {isLoadingIoBudgetData ? (
          <div className="space-y-2">
            <ShimmeringLoader />
            <ShimmeringLoader className="w-3/4" />
            <ShimmeringLoader className="w-1/2" />
          </div>
        ) : (
          <BarChart
            attribute={DISK_IO_BUDGET_KEY}
            data={ioBudgetData?.data ?? []}
            unit={ioBudgetData?.format}
            yLimit={100}
          />
        )}
      </SectionContent>
    </>
  )
}

export default Infrastructure
