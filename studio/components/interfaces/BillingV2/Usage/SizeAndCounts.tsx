import { useParams } from 'common'
import ShimmeringLoader from 'components/ui/ShimmeringLoader'
import SparkBar from 'components/ui/SparkBar'
import { useDailyStatsQuery } from 'data/analytics/daily-stats-query'
import { useProjectSubscriptionQuery } from 'data/subscriptions/project-subscription-query'
import { useProjectUsageQuery } from 'data/usage/project-usage-query'
import { formatBytes } from 'lib/helpers'
import { Button } from 'ui'
import BarChart from './BarChart'
import SectionContent from './SectionContent'
import SectionHeader from './SectionHeader'

const SizeAndCounts = () => {
  const { ref } = useParams()
  const { data: usage } = useProjectUsageQuery({ projectRef: ref })
  const { data: subscription } = useProjectSubscriptionQuery({ projectRef: ref })
  const { current_period_start, current_period_end } = subscription?.billing ?? {}
  const startDate = new Date((current_period_start ?? 0) * 1000).toISOString()
  const endDate = new Date((current_period_end ?? 0) * 1000).toISOString()

  const TOTAL_DB_SIZE_KEY = 'total_db_size_bytes'
  const { db_size } = usage ?? {}
  const dbSizeExcess = (db_size?.usage ?? 0) - (db_size?.limit ?? 0)
  const { data: dbSizeData, isLoading: isLoadingDbSizeData } = useDailyStatsQuery({
    projectRef: ref,
    attribute: TOTAL_DB_SIZE_KEY,
    interval: '1d',
    startDate,
    endDate,
  })

  const TOTAL_STORAGE_SIZE_KEY = 'total_storage_size_bytes'
  const { storage_size } = usage ?? {}
  const storageSizeExcess = (storage_size?.usage ?? 0) - (storage_size?.limit ?? 0)
  const { data: storageSizeData, isLoading: isLoadingStorageSizeData } = useDailyStatsQuery({
    projectRef: ref,
    attribute: TOTAL_STORAGE_SIZE_KEY,
    interval: '1d',
    startDate,
    endDate,
  })

  return (
    <>
      <SectionHeader title="Size & Counts" description="Some description here" />

      <SectionContent title="Database Size" description="Some description here">
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
            attribute={TOTAL_DB_SIZE_KEY}
            data={dbSizeData?.data ?? []}
            unit={undefined}
            yDomain={[0, db_size?.limit ?? 0]}
            yLeftMargin={14}
            yFormatter={(value) => formatBytes(value, 1, 'GB').replace(/\s/g, '')}
          />
        )}
      </SectionContent>

      <SectionContent title="Storage Size" description="Some description here">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm">Storage {subscription?.tier.key.toLowerCase()} quota usage</p>
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
            attribute={TOTAL_STORAGE_SIZE_KEY}
            data={storageSizeData?.data ?? []}
            unit={undefined}
            yDomain={[0, storage_size?.limit ?? 0]}
            yLeftMargin={14}
            yFormatter={(value) => formatBytes(value, 1, 'GB').replace(/\s/g, '')}
          />
        )}
      </SectionContent>
    </>
  )
}

export default SizeAndCounts
