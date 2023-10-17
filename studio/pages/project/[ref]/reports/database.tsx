import { useParams } from 'common/hooks'
import dayjs from 'dayjs'
import { observer } from 'mobx-react-lite'
import Link from 'next/link'
import { useState } from 'react'
import { Badge, Button, IconArrowRight, IconExternalLink } from 'ui'

import { ReportsLayout } from 'components/layouts'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import ChartHandler from 'components/to-be-cleaned/Charts/ChartHandler'
import DateRangePicker from 'components/to-be-cleaned/DateRangePicker'
import Panel from 'components/ui/Panel'
import SparkBar from 'components/ui/SparkBar'
import { useDatabaseSizeQuery } from 'data/database/database-size-query'
import { useProjectSubscriptionV2Query } from 'data/subscriptions/project-subscription-v2-query'
import { useProjectUsageQuery } from 'data/usage/project-usage-query'
import { useSelectedOrganization } from 'hooks'
import { GB, TIME_PERIODS_INFRA, USAGE_APPROACHING_THRESHOLD } from 'lib/constants'
import { formatBytes } from 'lib/helpers'
import { NextPageWithLayout } from 'types'

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
  const { ref: projectRef } = useParams()
  const { project } = useProjectContext()
  const selectedOrganization = useSelectedOrganization()
  const { data: usage } = useProjectUsageQuery({ projectRef })
  const { data: subscription } = useProjectSubscriptionV2Query({ projectRef })

  const [dateRange, setDateRange] = useState<any>(undefined)

  const databaseUsageLimit = usage?.db_size?.limit ?? 0
  const databaseEgressLimit = usage?.db_egress?.limit ?? 0

  const { data } = useDatabaseSizeQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })
  const databaseSize = data?.result[0].db_size ?? 0

  const databaseSizeUsageRatio = databaseSize / databaseUsageLimit
  const limitIsApproaching = databaseSizeUsageRatio >= USAGE_APPROACHING_THRESHOLD
  const limitIsExceeded = databaseSizeUsageRatio >= 1

  const diskSize = usage?.disk_volume_size_gb ?? 0
  const diskSizeUsageRatio = databaseSize / diskSize

  const egressIsApproaching = databaseSizeUsageRatio >= USAGE_APPROACHING_THRESHOLD
  const egressIsExceeded = databaseSizeUsageRatio >= 1

  const subscriptionPlan = subscription?.plan?.id

  const isPaidTier = subscriptionPlan !== 'free'

  // Can be null or undefined, thus !=
  const orgLevelBilling = selectedOrganization?.subscription_id != undefined
  const maxDiskVolumeSize =
    (usage?.disk_volume_size_gb ?? 0 > 0 ? usage?.disk_volume_size_gb ?? 0 : Infinity) * GB

  return (
    <>
      <div>
        <section>
          <Panel title={<h2>Database usage</h2>}>
            {orgLevelBilling ? (
              <Panel.Content>
                <div className="space-y-1">
                  <h5 className="text-sm text-foreground">Disk Usage</h5>
                  <SparkBar
                    type="horizontal"
                    value={databaseSize}
                    max={maxDiskVolumeSize}
                    barClass={`${
                      diskSizeUsageRatio >= 0.9 && !isPaidTier
                        ? 'bg-red-900'
                        : diskSizeUsageRatio >= 0.9
                        ? 'bg-yellow-900'
                        : 'bg-brand'
                    }`}
                    bgClass="bg-gray-300 dark:bg-gray-600"
                    labelBottom={formatBytes(databaseSize)}
                    labelTop={usage?.disk_volume_size_gb ? usage?.disk_volume_size_gb + 'GB' : '-'}
                  />
                </div>

                {isPaidTier && (
                  <div className="flex justify-between items-center mt-3">
                    <div className="flex flex-row space-x-3 text-foreground-light text-sm">
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
            ) : (
              <Panel.Content>
                <div className="space-y-1">
                  <h5 className="text-sm text-foreground">Database size</h5>
                  <SparkBar
                    type="horizontal"
                    value={databaseSize}
                    max={databaseUsageLimit > 0 ? databaseUsageLimit : Infinity}
                    barClass={`${
                      limitIsExceeded
                        ? 'bg-red-900'
                        : limitIsApproaching
                        ? 'bg-yellow-900'
                        : 'bg-brand'
                    }`}
                    bgClass="bg-gray-300 dark:bg-gray-600"
                    labelBottom={formatBytes(databaseSize)}
                    labelTop={databaseUsageLimit > 0 ? formatBytes(databaseUsageLimit) : ''}
                  />
                </div>

                {isPaidTier && (
                  <div className="flex justify-between items-center mt-3">
                    <div className="flex flex-row space-x-3 text-foreground-light text-sm">
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
            )}

            {!orgLevelBilling && (
              <Panel.Content>
                <div className="space-y-1">
                  <h5 className="text-sm text-foreground">Database egress</h5>
                  <SparkBar
                    type="horizontal"
                    value={usage?.db_egress?.usage ?? 0}
                    max={databaseEgressLimit > 0 ? databaseEgressLimit : Infinity}
                    barClass={`${
                      egressIsExceeded
                        ? 'bg-red-900'
                        : egressIsApproaching
                        ? 'bg-yellow-900'
                        : 'bg-brand'
                    }`}
                    bgClass="bg-gray-300 dark:bg-gray-600"
                    labelBottom={formatBytes(usage?.db_egress?.usage ?? 0)}
                    labelTop={databaseEgressLimit > 0 ? formatBytes(databaseEgressLimit) : ''}
                  />
                </div>
              </Panel.Content>
            )}

            {orgLevelBilling && (
              <Panel.Content>
                <p className="text-sm text-foreground">
                  Head to your{' '}
                  <Link href={`/org/${selectedOrganization?.slug}/usage`}>
                    <a>
                      <span className="text-green-900 transition hover:text-green-1000">
                        organizations usage page
                      </span>
                    </a>
                  </Link>
                  , to see a breakdown of your entire usage.
                </p>
              </Panel.Content>
            )}
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
                    <p className="text-foreground-light">
                      {dayjs(dateRange.period_start.date).format('MMMM D, hh:mma')}
                    </p>
                    <p className="text-foreground-light">
                      <IconArrowRight size={12} />
                    </p>
                    <p className="text-foreground-light">
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
