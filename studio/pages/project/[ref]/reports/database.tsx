import dayjs from 'dayjs'
import { useRouter } from 'next/router'
import { observer } from 'mobx-react-lite'
import { FC, useEffect, useState } from 'react'
import { IconArrowRight } from 'ui'

import { useStore, useProjectUsage } from 'hooks'
import { formatBytes } from 'lib/helpers'
import { TIME_PERIODS_INFRA, USAGE_APPROACHING_THRESHOLD } from 'lib/constants'
import { NextPageWithLayout } from 'types'

import ReportsLayout from 'components/layouts/ReportsLayout/ReportsLayout'
import ChartHandler from 'components/to-be-cleaned/Charts/ChartHandler'
import DateRangePicker from 'components/to-be-cleaned/DateRangePicker'
import Panel from 'components/ui/Panel'
import SparkBar from 'components/ui/SparkBar'

const DatabaseReport: NextPageWithLayout = () => {
  const { ui } = useStore()
  const project = ui.selectedProject

  return (
    <div className="1xl:px-28 mx-auto flex flex-col gap-4 px-5 py-6 lg:px-16 xl:px-24 2xl:px-32">
      <div className="content h-full w-full overflow-y-auto">
        <div className="w-full">
          <DatabaseUsage project={project} />
        </div>
      </div>
    </div>
  )
}

DatabaseReport.getLayout = (page) => <ReportsLayout title="Database">{page}</ReportsLayout>

export default observer(DatabaseReport)

const DatabaseUsage: FC<any> = () => {
  const router = useRouter()
  const { meta, ui } = useStore()
  const [databaseSize, setDatabaseSize] = useState<any>(0)
  const [dateRange, setDateRange] = useState<any>(undefined)

  const { ref } = router.query
  const { usage } = useProjectUsage(ref as string)

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
                  value={'3h'}
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
                    attribute={'cpu_usage'}
                    label={'CPU usage'}
                    interval={dateRange.interval}
                    provider={'infra-monitoring'}
                  />
                )}

                {dateRange && (
                  <ChartHandler
                    startDate={dateRange?.period_start?.date}
                    endDate={dateRange?.period_end?.date}
                    attribute={'disk_io_budget'}
                    label={'Daily Disk IO Budget remaining'}
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
}
