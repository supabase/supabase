import { useParams } from 'common'
import ShimmeringLoader from 'components/ui/ShimmeringLoader'
import BarChart from './BarChart'
import { useDailyStatsQuery } from 'data/analytics/daily-stats-query'
import { useProjectSubscriptionQuery } from 'data/subscriptions/project-subscription-query'
import { useProjectUsageQuery } from 'data/usage/project-usage-query'
import SparkBar from 'components/ui/SparkBar'
import { formatBytes } from 'lib/helpers'
import { Button } from 'ui'

const SizeAndCounts = () => {
  const { ref } = useParams()
  const { data: usage } = useProjectUsageQuery({ projectRef: ref })
  const { data: subscription } = useProjectSubscriptionQuery({ projectRef: ref })
  const { current_period_start, current_period_end } = subscription?.billing ?? {}
  const startDate = new Date((current_period_start ?? 0) * 1000).toISOString()
  const endDate = new Date((current_period_end ?? 0) * 1000).toISOString()

  // [JOSHEN TODO] Attribute needs to change after confirming with team o11y if this is implemented
  const { db_size } = usage ?? {}
  const dbSizeExcess = (db_size?.usage ?? 0) - (db_size?.limit ?? 0)
  const { data: dbSizeData, isLoading: isLoadingDbSizeData } = useDailyStatsQuery({
    projectRef: ref,
    attribute: 'total_rest_egress',
    interval: '1d',
    startDate,
    endDate,
  })

  // [JOSHEN TODO] Attribute needs to change after confirming with team o11y if this is implemented
  const { storage_size } = usage ?? {}
  const storageSizeExcess = (storage_size?.usage ?? 0) - (storage_size?.limit ?? 0)
  const { data: storageSizeData, isLoading: isLoadingStorageSizeData } = useDailyStatsQuery({
    projectRef: ref,
    attribute: 'total_storage_egress',
    interval: '1d',
    startDate,
    endDate,
  })

  return (
    <>
      <div className="border-b">
        <div className="1xl:px-28 mx-auto flex flex-col gap-10 px-5 lg:px-16 2xl:px-32 py-16">
          <div className="sticky top-16">
            <p className="text-base">Size & Counts</p>
            <p className="text-sm text-scale-1000">Some description here</p>
          </div>
        </div>
      </div>

      {/* DATABASE SIZE - need to fix if no value yet (API will return period_start as 0 in first data point) */}
      <div className="border-b">
        <div className="1xl:px-28 mx-auto flex flex-col gap-10 px-5 lg:px-16 2xl:px-32 py-16">
          <div className="grid grid-cols-12">
            <div className="col-span-5">
              <div className="sticky top-16">
                <p className="text-base">Database size</p>
                <p className="text-sm text-scale-1000">Some description here</p>
              </div>
            </div>
            <div className="col-span-7 space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm">Database size per day</p>
                  <Button type="default" size="tiny" onClick={() => {}}>
                    Upgrade project
                  </Button>
                </div>
                <SparkBar
                  type="horizontal"
                  barClass="bg-scale-1200"
                  value={db_size?.usage ?? 0}
                  max={db_size?.limit ?? 0}
                />
                <div>
                  <div className="flex items-center justify-between border-b py-1">
                    <p className="text-xs text-scale-1000">
                      Included in {subscription?.tier.name.toLowerCase()}
                    </p>
                    <p className="text-xs">{formatBytes(db_size?.limit ?? 0)}</p>
                  </div>
                  <div className="flex items-center justify-between border-b py-1">
                    <p className="text-xs text-scale-1000">Used</p>
                    <p className="text-xs">{formatBytes(db_size?.usage ?? 0)}</p>
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <p className="text-xs text-scale-1000">Extra volume used this month</p>
                    <p className="text-xs">
                      {dbSizeExcess < 0 ? formatBytes(0) : formatBytes(dbSizeExcess)}
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-1">
                <p>Database egress over time</p>
                <p className="text-sm text-scale-1000">Some description here</p>
              </div>
              {isLoadingDbSizeData ? (
                <div className="space-y-2">
                  <ShimmeringLoader />
                  <ShimmeringLoader className="w-3/4" />
                  <ShimmeringLoader className="w-1/2" />
                </div>
              ) : (
                <BarChart
                  attribute="total_rest_egress"
                  data={dbSizeData?.data ?? []}
                  unit={undefined}
                  yDomain={[0, 100]}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* STORAGE SIZE - need to fix if no value yet (API will return period_start as 0 in first data point) */}
      <div className="border-b">
        <div className="1xl:px-28 mx-auto flex flex-col gap-10 px-5 lg:px-16 2xl:px-32 py-16">
          <div className="grid grid-cols-12">
            <div className="col-span-5">
              <div className="sticky top-16">
                <p className="text-base">Storage size</p>
                <p className="text-sm text-scale-1000">Some description here</p>
              </div>
            </div>
            <div className="col-span-7 space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm">
                    Storage {subscription?.tier.key.toLowerCase()} quota usage
                  </p>
                  <Button type="default" size="tiny" onClick={() => {}}>
                    Upgrade project
                  </Button>
                </div>
                <SparkBar
                  type="horizontal"
                  barClass="bg-scale-1200"
                  value={storage_size?.usage ?? 0}
                  max={storage_size?.limit ?? 0}
                />
                <div>
                  <div className="flex items-center justify-between border-b py-1">
                    <p className="text-xs text-scale-1000">
                      Included in {subscription?.tier.name.toLowerCase()}
                    </p>
                    <p className="text-xs">{formatBytes(storage_size?.limit ?? 0)}</p>
                  </div>
                  <div className="flex items-center justify-between border-b py-1">
                    <p className="text-xs text-scale-1000">Used</p>
                    <p className="text-xs">{formatBytes(storage_size?.usage ?? 0)}</p>
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <p className="text-xs text-scale-1000">Extra volume used this month</p>
                    <p className="text-xs">
                      {storageSizeExcess < 0 ? formatBytes(0) : formatBytes(storageSizeExcess)}
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-1">
                <p>Storage size over time</p>
                <p className="text-sm text-scale-1000">Some description here</p>
              </div>
              {isLoadingStorageSizeData ? (
                <div className="space-y-2">
                  <ShimmeringLoader />
                  <ShimmeringLoader className="w-3/4" />
                  <ShimmeringLoader className="w-1/2" />
                </div>
              ) : (
                <BarChart
                  attribute="total_rest_egress"
                  data={storageSizeData?.data ?? []}
                  unit={undefined}
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

export default SizeAndCounts
