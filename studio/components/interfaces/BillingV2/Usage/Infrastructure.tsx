import { useParams } from 'common'
import ShimmeringLoader from 'components/ui/ShimmeringLoader'
import { useInfraMonitoringQuery } from 'data/analytics/infra-monitoring-query'
import { useProjectSubscriptionQuery } from 'data/subscriptions/project-subscription-query'
import BarChart from './BarChart'

const Infrastructure = () => {
  const { ref } = useParams()
  const { data: subscription } = useProjectSubscriptionQuery({ projectRef: ref })
  const { current_period_start, current_period_end } = subscription?.billing ?? {}
  const startDate = new Date((current_period_start ?? 0) * 1000).toISOString()
  const endDate = new Date((current_period_end ?? 0) * 1000).toISOString()

  const { data: cpuUsageData, isLoading: isLoadingCpuUsageData } = useInfraMonitoringQuery({
    projectRef: ref,
    attribute: 'cpu_usage',
    interval: '1d',
    startDate,
    endDate,
    modifier: (x: number) => x * 100,
  })

  const { data: memoryUsageData, isLoading: isLoadingMemoryUsageData } = useInfraMonitoringQuery({
    projectRef: ref,
    attribute: 'ram_usage',
    interval: '1d',
    startDate,
    endDate,
  })

  const { data: ioBudgetData, isLoading: isLoadingIoBudgetData } = useInfraMonitoringQuery({
    projectRef: ref,
    attribute: 'disk_io_budget',
    interval: '1d',
    startDate,
    endDate,
  })

  return (
    <>
      <div className="border-b">
        <div className="1xl:px-28 mx-auto flex flex-col gap-10 px-5 lg:px-16 2xl:px-32 py-16">
          <div className="sticky top-16">
            <p className="text-base">Infrastructure</p>
            <p className="text-sm text-scale-1000">Some description here</p>
          </div>
        </div>
      </div>

      {/* CPU USAGE */}
      <div className="border-b">
        <div className="1xl:px-28 mx-auto flex flex-col gap-10 px-5 lg:px-16 2xl:px-32 py-16">
          <div className="grid grid-cols-12">
            <div className="col-span-5">
              <div className="sticky top-16">
                <p className="text-base">CPU</p>
                <p className="text-sm text-scale-1000">Some description here</p>
              </div>
            </div>
            <div className="col-span-7 space-y-6">
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
                  attribute="cpu_usage"
                  data={cpuUsageData?.data ?? []}
                  unit={cpuUsageData?.format}
                  yDomain={[0, 100]}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* MEMORY USAGE */}
      <div className="border-b">
        <div className="1xl:px-28 mx-auto flex flex-col gap-10 px-5 lg:px-16 2xl:px-32 py-16">
          <div className="grid grid-cols-12">
            <div className="col-span-5">
              <div className="sticky top-16">
                <p className="text-base">Memory</p>
                <p className="text-sm text-scale-1000">Some description here</p>
              </div>
            </div>
            <div className="col-span-7 space-y-6">
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
                  attribute="ram_usage"
                  data={memoryUsageData?.data ?? []}
                  unit={memoryUsageData?.format}
                  yDomain={[0, 100]}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* DISK IO BUDGET */}
      <div className="border-b">
        <div className="1xl:px-28 mx-auto flex flex-col gap-10 px-5 lg:px-16 2xl:px-32 py-16">
          <div className="grid grid-cols-12">
            <div className="col-span-5">
              <div className="sticky top-16">
                <p className="text-base">IO Budget</p>
                <p className="text-sm text-scale-1000">Some description here</p>
              </div>
            </div>
            <div className="col-span-7 space-y-6">
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
                  attribute="disk_io_budget"
                  data={ioBudgetData?.data ?? []}
                  unit={ioBudgetData?.format}
                  yDomain={[0, 100]}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Infrastructure
