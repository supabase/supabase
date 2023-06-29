import dayjs from 'dayjs'
import { observer } from 'mobx-react-lite'
import { useEffect, useState } from 'react'

import { useParams } from 'common/hooks'
import { useStore } from 'hooks'
import {
  PRICING_TIER_PRODUCT_IDS,
  TIME_PERIODS_INFRA,
  USAGE_APPROACHING_THRESHOLD,
} from 'lib/constants'
import { formatBytes } from 'lib/helpers'
import { NextPageWithLayout } from 'types'
import { Badge, Button, IconArrowRight, IconExternalLink } from 'ui'

import { ReportsLayout } from 'components/layouts'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import ChartHandler from 'components/to-be-cleaned/Charts/ChartHandler'
import DateRangePicker from 'components/to-be-cleaned/DateRangePicker'
import Panel from 'components/ui/Panel'
import SparkBar from 'components/ui/SparkBar'
import { useProjectUsageQuery } from 'data/usage/project-usage-query'

const DatabaseReport: NextPageWithLayout = () => {
  return (
    <div className="1xl:px-28 mx-auto flex flex-col gap-4 px-5 py-6 lg:px-16 xl:px-24 2xl:px-32">
      <div className="content h-full w-full overflow-y-auto">
        <div className="w-full">
          <DatabaseUsage />
        </div>
      </div>
    </div>
  )
}

DatabaseReport.getLayout = (page) => <ReportsLayout title="Database">{page}</ReportsLayout>

export default DatabaseReport

const DatabaseUsage = observer(() => {
  const { meta, ui } = useStore()
  const { project } = useProjectContext()
  const [databaseSize, setDatabaseSize] = useState<any>(0)
  const [dateRange, setDateRange] = useState<any>(undefined)

  const { ref: projectRef } = useParams()
  const { data: usage } = useProjectUsageQuery({ projectRef })

  const databaseSizeLimit = usage?.db_size?.limit ?? 0
  const databaseEgressLimit = usage?.db_egress?.limit ?? 0

  useEffect(() => {
    let cancel = false
    const getDatabaseSize = async () => {
      const res = await meta.query(
        'select sum(pg_database_size(pg_database.datname))::bigint as db_size from pg_database;'
      )
      if (!res.error && !cancel) {
        setDatabaseSize(res[0].db_size)
      } else {
        ui.setNotification({ category: 'error', message: 'Failed to retrieve database size' })
      }
    }
    getDatabaseSize()

    return () => {
      cancel = true
    }
  }, [])

  const databaseSizeUsageRatio = databaseSize / databaseSizeLimit
  const sizeIsApproaching = databaseSizeUsageRatio >= USAGE_APPROACHING_THRESHOLD
  const sizeIsExceeded = databaseSizeUsageRatio >= 1

  const egressIsApproaching = databaseSizeUsageRatio >= USAGE_APPROACHING_THRESHOLD
  const egressIsExceeded = databaseSizeUsageRatio >= 1

  const subscriptionTier = project?.subscription_tier

  const isPaidTier = subscriptionTier !== PRICING_TIER_PRODUCT_IDS.FREE

  return (
    <>
      <div>
        <section>
          <Panel title={<h2>Database usage</h2>}>
            <Panel.Content>
              <div className="space-y-1">
                <h5 className="text-sm text-scale-1200">Database size</h5>
                <SparkBar
                  type="horizontal"
                  value={databaseSize}
                  max={databaseSizeLimit > 0 ? databaseSizeLimit : Infinity}
                  barClass={`${
                    sizeIsExceeded
                      ? 'bg-red-900'
                      : sizeIsApproaching
                      ? 'bg-yellow-900'
                      : 'bg-brand-900'
                  }`}
                  labelBottom={formatBytes(databaseSize)}
                  labelTop={databaseSizeLimit > 0 ? formatBytes(databaseSizeLimit) : ''}
                />
              </div>

              {isPaidTier && (
                <div className="flex justify-between items-center mt-3">
                  <div className="flex flex-row space-x-3 text-scale-1000 text-sm">
                    {usage?.disk_volume_size_gb && (
                      <span>Disk Size: {usage.disk_volume_size_gb} GB</span>
                    )}
                    <Badge>Auto-Scaling</Badge>
                  </div>

                  <Button type="default" icon={<IconExternalLink size={14} strokeWidth={1.5} />}>
                    <a
                      target="_blank"
                      rel="noreferrer"
                      href="https://supabase.com/docs/guides/platform/database-usage"
                    >
                      What is disk size?
                    </a>
                  </Button>
                </div>
              )}
            </Panel.Content>
            <Panel.Content>
              <div className="space-y-1">
                <h5 className="text-sm text-scale-1200">Database egress</h5>
                <SparkBar
                  type="horizontal"
                  value={usage?.db_egress?.usage ?? 0}
                  max={databaseEgressLimit > 0 ? databaseEgressLimit : Infinity}
                  barClass={`${
                    egressIsExceeded
                      ? 'bg-red-900'
                      : egressIsApproaching
                      ? 'bg-yellow-900'
                      : 'bg-brand-900'
                  }`}
                  labelBottom={formatBytes(usage?.db_egress?.usage ?? 0)}
                  labelTop={databaseEgressLimit > 0 ? formatBytes(databaseEgressLimit) : ''}
                />
              </div>
            </Panel.Content>
          </Panel>

          <Panel title={<h2>Database health</h2>}>
            <Panel.Content>
              <div className="mb-4 flex items-center space-x-3">
                <DateRangePicker
                  loading={false}
                  value={'7d'}
                  options={TIME_PERIODS_INFRA}
                  currentBillingPeriodStart={undefined}
                  onChange={setDateRange}
                />
                {dateRange && (
                  <div className="flex items-center space-x-2">
                    <p className="text-scale-1000">
                      {dayjs(dateRange.period_start.date).format('MMMM D, hh:mma')}
                    </p>
                    <p className="text-scale-1000">
                      <IconArrowRight size={12} />
                    </p>
                    <p className="text-scale-1000">
                      {dayjs(dateRange.period_end.date).format('MMMM D, hh:mma')}
                    </p>
                  </div>
                )}
              </div>
              <div className="space-y-6">
                {dateRange && (
                  <ChartHandler
                    startDate={dateRange?.period_start?.date}
                    endDate={dateRange?.period_end?.date}
                    attribute={'ram_usage'}
                    label={'Memory usage'}
                    interval={dateRange.interval}
                    provider={'infra-monitoring'}
                  />
                )}

                {dateRange && (
                  <ChartHandler
                    startDate={dateRange?.period_start?.date}
                    endDate={dateRange?.period_end?.date}
                    attribute={'swap_usage'}
                    label={'Swap usage'}
                    interval={dateRange.interval}
                    provider={'infra-monitoring'}
                  />
                )}

                {dateRange && (
                  <ChartHandler
                    startDate={dateRange?.period_start?.date}
                    endDate={dateRange?.period_end?.date}
                    attribute={'avg_cpu_usage'}
                    label={'Average CPU usage'}
                    interval={dateRange.interval}
                    provider={'infra-monitoring'}
                  />
                )}

                {dateRange && (
                  <ChartHandler
                    startDate={dateRange?.period_start?.date}
                    endDate={dateRange?.period_end?.date}
                    attribute={'max_cpu_usage'}
                    label={'Max CPU usage'}
                    interval={dateRange.interval}
                    provider={'infra-monitoring'}
                  />
                )}

                {dateRange && (
                  <ChartHandler
                    startDate={dateRange?.period_start?.date}
                    endDate={dateRange?.period_end?.date}
                    attribute={'disk_io_consumption'}
                    label={'Disk IO consumed'}
                    interval={dateRange.interval}
                    provider={'infra-monitoring'}
                  />
                )}
              </div>
            </Panel.Content>
          </Panel>
        </section>
      </div>
    </>
  )
})
