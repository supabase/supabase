import { useParams } from 'common'
import ShimmeringLoader from 'components/ui/ShimmeringLoader'
import SparkBar from 'components/ui/SparkBar'
import { useDailyStatsQuery } from 'data/analytics/daily-stats-query'
import { useProjectSubscriptionQuery } from 'data/subscriptions/project-subscription-query'
import { useProjectUsageQuery } from 'data/usage/project-usage-query'
import { formatBytes } from 'lib/helpers'
import { Button } from 'ui'
import BarChart from './BarChart'

const Bandwidth = () => {
  const { ref } = useParams()
  const { data: usage } = useProjectUsageQuery({ projectRef: ref })
  const { data: subscription } = useProjectSubscriptionQuery({ projectRef: ref })
  const { current_period_start, current_period_end } = subscription?.billing ?? {}
  const startDate = new Date((current_period_start ?? 0) * 1000).toISOString()
  const endDate = new Date((current_period_end ?? 0) * 1000).toISOString()

  // [JOSHEN TODO] Double check if this is the right attribute
  const DB_EGRESS_KEY = 'total_db_egress_bytes'
  const { db_egress } = usage ?? {}
  const dbEgressExcess = (db_egress?.usage ?? 0) - (db_egress?.limit ?? 0)
  const { data: dbEgressData, isLoading: isLoadingDbEgressData } = useDailyStatsQuery({
    projectRef: ref,
    attribute: DB_EGRESS_KEY,
    interval: '1d',
    startDate,
    endDate,
  })

  const STORAGE_EGRESS_KEY = 'total_storage_egress'
  const { storage_egress } = usage ?? {}
  const storageEgressExcess = (storage_egress?.usage ?? 0) - (storage_egress?.limit ?? 0)
  const { data: storageEgressData, isLoading: isLoadingStorageEgressData } = useDailyStatsQuery({
    projectRef: ref,
    attribute: STORAGE_EGRESS_KEY,
    interval: '1d',
    startDate,
    endDate,
  })

  return (
    <>
      <div className="border-b">
        <div className="1xl:px-28 mx-auto flex flex-col gap-10 px-5 lg:px-16 2xl:px-32 py-16">
          <div className="sticky top-16">
            <p className="text-base">Bandwidth</p>
            <p className="text-sm text-scale-1000">Some description here</p>
          </div>
        </div>
      </div>

      {/* DATABASE EGRESS - need to fix if no value yet (API will return period_start as 0 in first data point) */}
      <div className="border-b">
        <div className="1xl:px-28 mx-auto flex flex-col gap-10 px-5 lg:px-16 2xl:px-32 py-16">
          <div className="grid grid-cols-12">
            <div className="col-span-5">
              <div className="sticky top-16">
                <p className="text-base">Database Egress</p>
                <p className="text-sm text-scale-1000">Some description here</p>
              </div>
            </div>
            <div className="col-span-7 space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm">
                    Egress {subscription?.tier.key.toLowerCase()} quota usage
                  </p>
                  <Button type="default" size="tiny" onClick={() => {}}>
                    Upgrade project
                  </Button>
                </div>
                <SparkBar
                  type="horizontal"
                  barClass="bg-scale-1200"
                  value={db_egress?.usage ?? 0}
                  max={db_egress?.limit ?? 0}
                />
                <div>
                  <div className="flex items-center justify-between border-b py-1">
                    <p className="text-xs text-scale-1000">
                      Included in {subscription?.tier.name.toLowerCase()}
                    </p>
                    <p className="text-xs">{formatBytes(db_egress?.limit ?? 0)}</p>
                  </div>
                  <div className="flex items-center justify-between border-b py-1">
                    <p className="text-xs text-scale-1000">Used</p>
                    <p className="text-xs">{formatBytes(db_egress?.usage ?? 0)}</p>
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <p className="text-xs text-scale-1000">Extra volume used this month</p>
                    <p className="text-xs">
                      {dbEgressExcess < 0 ? formatBytes(0) : formatBytes(dbEgressExcess)}
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-1">
                <p>Database egress over time</p>
                <p className="text-sm text-scale-1000">Some description here</p>
              </div>
              {isLoadingDbEgressData ? (
                <div className="space-y-2">
                  <ShimmeringLoader />
                  <ShimmeringLoader className="w-3/4" />
                  <ShimmeringLoader className="w-1/2" />
                </div>
              ) : (
                <BarChart
                  attribute={DB_EGRESS_KEY}
                  data={dbEgressData?.data ?? []}
                  unit={undefined}
                  yDomain={[0, 100]}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* STORAGE EGRESS - need to fix if no value yet (API will return period_start as 0 in first data point) */}
      <div className="border-b">
        <div className="1xl:px-28 mx-auto flex flex-col gap-10 px-5 lg:px-16 2xl:px-32 py-16">
          <div className="grid grid-cols-12">
            <div className="col-span-5">
              <div className="sticky top-16">
                <p className="text-base">Storage Egress</p>
                <p className="text-sm text-scale-1000">Some description here</p>
              </div>
            </div>
            <div className="col-span-7 space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm">
                    Storage egress {subscription?.tier.key.toLowerCase()} quota usage
                  </p>
                  <Button type="default" size="tiny" onClick={() => {}}>
                    Upgrade project
                  </Button>
                </div>
                <SparkBar
                  type="horizontal"
                  barClass="bg-scale-1200"
                  value={storage_egress?.usage ?? 0}
                  max={storage_egress?.limit ?? 0}
                />
                <div>
                  <div className="flex items-center justify-between border-b py-1">
                    <p className="text-xs text-scale-1000">
                      Included in {subscription?.tier.name.toLowerCase()}
                    </p>
                    <p className="text-xs">{formatBytes(storage_egress?.limit ?? 0)}</p>
                  </div>
                  <div className="flex items-center justify-between border-b py-1">
                    <p className="text-xs text-scale-1000">Used</p>
                    <p className="text-xs">{formatBytes(storage_egress?.usage ?? 0)}</p>
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <p className="text-xs text-scale-1000">Extra volume used this month</p>
                    <p className="text-xs">
                      {storageEgressExcess < 0 ? formatBytes(0) : formatBytes(storageEgressExcess)}
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-1">
                <p>Storage egress over time</p>
                <p className="text-sm text-scale-1000">Some description here</p>
              </div>
              {isLoadingStorageEgressData ? (
                <div className="space-y-2">
                  <ShimmeringLoader />
                  <ShimmeringLoader className="w-3/4" />
                  <ShimmeringLoader className="w-1/2" />
                </div>
              ) : (
                <BarChart
                  attribute={STORAGE_EGRESS_KEY}
                  data={storageEgressData?.data ?? []}
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

export default Bandwidth
