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
      <SectionHeader title="Bandwidth" description="Some description here" />

      <SectionContent title="Database Egress" description="Some description here">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm">Egress {subscription?.tier.key.toLowerCase()} quota usage</p>
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
          // [Joshen] TODO
          // - the max Y domain could be dynamic (slightly above limit, but take the usage + some threshold if above limit)
          <BarChart
            attribute={DB_EGRESS_KEY}
            data={dbEgressData?.data ?? []}
            unit={undefined}
            yDomain={[0, db_egress?.limit ?? 0]}
            yLeftMargin={14}
            yFormatter={(value) => formatBytes(value, 1, 'GB').replace(/\s/g, '')}
          />
        )}
      </SectionContent>

      <SectionContent title="Storage Egress" description="Some description here">
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
            yDomain={[0, storage_egress?.limit ?? 0]}
            yLeftMargin={14}
            yFormatter={(value) => formatBytes(value, 1, 'GB').replace(/\s/g, '')}
          />
        )}
      </SectionContent>
    </>
  )
}

export default Bandwidth
