import { PermissionAction } from '@supabase/shared-types/out/constants'
import dayjs from 'dayjs'
import { ArrowRight, ExternalLink, ChevronDown, Database, Plus, X } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { AlertDescription_Shadcn_, Alert_Shadcn_, Button } from 'ui'

import { useParams } from 'common'
import ReportHeader from 'components/interfaces/Reports/ReportHeader'
import ReportPadding from 'components/interfaces/Reports/ReportPadding'
import ReportWidget from 'components/interfaces/Reports/ReportWidget'
import DiskSizeConfigurationModal from 'components/interfaces/Settings/Database/DiskSizeConfigurationModal'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import ReportsLayout from 'components/layouts/ReportsLayout/ReportsLayout'
import Table from 'components/to-be-cleaned/Table'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { DateTimeFormats } from 'components/ui/Charts/Charts.constants'
import ChartHandler from 'components/ui/Charts/ChartHandler'
import Panel from 'components/ui/Panel'
import { REPORTS_DATEPICKER_HELPERS } from 'components/interfaces/Reports/Reports.constants'
import { useProjectDiskResizeMutation } from 'data/config/project-disk-resize-mutation'
import { useDatabaseSizeQuery } from 'data/database/database-size-query'
import { useDatabaseReport } from 'data/reports/database-report-query'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { formatBytes } from 'lib/helpers'
import ShimmerLine from 'components/ui/ShimmerLine'
import { useDatabaseSelectorStateSnapshot } from 'state/database-selector'
import type { NextPageWithLayout } from 'types'
import DatePickers from 'components/interfaces/Settings/Logs/Logs.DatePickers'
import { useOrgSubscriptionQuery } from 'data/subscriptions/org-subscription-query'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'

const DatabaseReport: NextPageWithLayout = () => {
  return (
    <ReportPadding>
      <DatabaseUsage />
    </ReportPadding>
  )
}

DatabaseReport.getLayout = (page) => <ReportsLayout title="Database">{page}</ReportsLayout>

export default DatabaseReport

const DatabaseUsage = () => {
  const { db, chart, ref } = useParams()
  const { project } = useProjectContext()
  const organization = useSelectedOrganization()

  const state = useDatabaseSelectorStateSnapshot()
  const [dateRange, setDateRange] = useState<any>(undefined)

  const { data: subscription } = useOrgSubscriptionQuery({ orgSlug: organization?.slug })
  const plan = subscription?.plan

  const isReplicaSelected = state.selectedDatabaseId !== project?.ref

  const report = useDatabaseReport()
  const { data } = useDatabaseSizeQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })
  const databaseSizeBytes = data ?? 0
  const currentDiskSize = project?.volumeSizeGb ?? 0

  const [showIncreaseDiskSizeModal, setshowIncreaseDiskSizeModal] = useState(false)
  const canUpdateDiskSizeConfig = useCheckPermissions(PermissionAction.UPDATE, 'projects', {
    resource: {
      project_id: project?.id,
    },
  })

  const { isLoading: isUpdatingDiskSize } = useProjectDiskResizeMutation({
    onSuccess: (res, variables) => {
      toast.success(`Successfully updated disk size to ${variables.volumeSize} GB`)
      setshowIncreaseDiskSizeModal(false)
    },
  })

  // [Joshen] Empty dependency array as we only want this running once
  useEffect(() => {
    if (db !== undefined) {
      setTimeout(() => {
        // [Joshen] Adding a timeout here to support navigation from settings to reports
        // Both are rendering different instances of ProjectLayout which is where the
        // DatabaseSelectorContextProvider lies in (unless we reckon shifting the provider up one more level is better)
        state.setSelectedDatabaseId(db)
      }, 100)
    }
    if (chart !== undefined) {
      setTimeout(() => {
        const el = document.getElementById(chart)
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 200)
    }
  }, [db, chart])

  const handleIntervalGranularity = (from: string, to: string) => {
    const conditions = {
      '15s': dayjs(to).diff(from, 'hour') < 1, // less than 1 hour
      '1m': dayjs(to).diff(from, 'hour') < 3, // less than 3 hours
      '10m': dayjs(to).diff(from, 'hour') < 6, // less than 6 hours
      '30m': dayjs(to).diff(from, 'hour') < 12, // less than 12 hours
      '1h': dayjs(to).diff(from, 'hour') >= 12, // more than 12 hours
    }

    switch (true) {
      case conditions['15s']:
        return '15s'
      case conditions['1m']:
        return '1m'
      case conditions['10m']:
        return '10m'
      case conditions['30m']:
        return '30m'
      default:
        return '1h'
    }
  }

  const handleCustomDateFormat =
    handleIntervalGranularity(dateRange?.period_start?.date, dateRange?.period_end?.date) === '15s'
      ? DateTimeFormats.FULL_SECONDS
      : undefined

  return (
    <>
      <ReportHeader showDatabaseSelector title="Database" />
      <div className="w-full flex flex-col gap-1">
        <div className="h-2 w-full">
          <ShimmerLine active={report.isLoading} />
        </div>
      </div>
      <section>
        <Panel className="bg-transparent" title={<h2>Database health</h2>}>
          <Panel.Content>
            <div className="mb-4 flex items-center justify-between space-x-3">
              <DatePickers
                onChange={(values: any) => {
                  setDateRange({
                    period_start: { date: values.from, time_period: '7d' },
                    period_end: { date: values.to, time_period: 'today' },
                    interval: handleIntervalGranularity(values.from, values.to),
                  })
                }}
                to={dateRange?.period_start?.date}
                from={dateRange?.period_end?.date}
                helpers={REPORTS_DATEPICKER_HELPERS.map((helper, index) => ({
                  ...helper,
                  disabled: (index > 4 && plan?.id === 'free') || (index > 5 && plan?.id !== 'pro'),
                }))}
              />
              {dateRange && (
                <div className="flex items-center gap-x-2">
                  <p className="text-foreground-light">
                    {dayjs(dateRange.period_start.date).format('MMM D, h:mma')}
                  </p>
                  <p className="text-foreground-light">
                    <ArrowRight size={12} />
                  </p>
                  <p className="text-foreground-light">
                    {dayjs(dateRange.period_end.date).format('MMM D, h:mma')}
                  </p>
                </div>
              )}
            </div>
            <div className="grid 2xl:grid-cols-2 gap-4">
              {dateRange && (
                <ChartHandler
                  provider="infra-monitoring"
                  attribute="ram_usage"
                  label="Memory usage"
                  interval={dateRange.interval}
                  startDate={dateRange?.period_start?.date}
                  endDate={dateRange?.period_end?.date}
                  customDateFormat={handleCustomDateFormat}
                />
              )}

              {dateRange && (
                <ChartHandler
                  provider="infra-monitoring"
                  attribute="avg_cpu_usage"
                  label="Average CPU usage"
                  interval={dateRange.interval !== '15s' ? dateRange.interval : '1m'}
                  startDate={dateRange?.period_start?.date}
                  endDate={dateRange?.period_end?.date}
                  customDateFormat={handleCustomDateFormat}
                />
              )}

              {dateRange && (
                <ChartHandler
                  provider="infra-monitoring"
                  attribute="max_cpu_usage"
                  label="Max CPU usage"
                  interval={dateRange.interval}
                  startDate={dateRange?.period_start?.date}
                  endDate={dateRange?.period_end?.date}
                  customDateFormat={handleCustomDateFormat}
                />
              )}

              {dateRange && (
                <ChartHandler
                  provider="infra-monitoring"
                  attribute="disk_io_consumption"
                  label="Disk IO consumed"
                  interval={dateRange.interval}
                  startDate={dateRange?.period_start?.date}
                  endDate={dateRange?.period_end?.date}
                  customDateFormat={handleCustomDateFormat}
                />
              )}

              {dateRange && (
                <ChartHandler
                  provider="infra-monitoring"
                  attribute="pg_stat_database_num_backends"
                  label="Number of database connections"
                  interval={dateRange.interval}
                  startDate={dateRange?.period_start?.date}
                  endDate={dateRange?.period_end?.date}
                  customDateFormat={handleCustomDateFormat}
                />
              )}

              {dateRange && (
                <ChartHandler
                  provider="infra-monitoring"
                  attribute="client_connections_postgres"
                  label="Client connections - Postgres"
                  // defaultChartStyle="stackedAreaLine"
                  interval={dateRange.interval}
                  startDate={dateRange?.period_start?.date}
                  endDate={dateRange?.period_end?.date}
                  customDateFormat={handleCustomDateFormat}
                />
              )}
              {dateRange && (
                <ChartHandler
                  provider="infra-monitoring"
                  attribute="client_connections_supavisor"
                  label="Client connections - Supavisor"
                  // defaultChartStyle="stackedAreaLine"
                  interval={dateRange.interval}
                  startDate={dateRange?.period_start?.date}
                  endDate={dateRange?.period_end?.date}
                  customDateFormat={handleCustomDateFormat}
                />
              )}
              {dateRange && (
                <ChartHandler
                  provider="infra-monitoring"
                  attribute="client_connections_pgbouncer"
                  label="Client connections - pgbouncer"
                  // defaultChartStyle="stackedAreaLine"
                  interval={dateRange.interval}
                  startDate={dateRange?.period_start?.date}
                  endDate={dateRange?.period_end?.date}
                  customDateFormat={handleCustomDateFormat}
                />
              )}
              {dateRange && (
                <ChartHandler
                  provider="infra-monitoring"
                  attribute="client_connections_realtime"
                  label="Client connections - Realtime"
                  // defaultChartStyle="stackedAreaLine"
                  interval={dateRange.interval}
                  startDate={dateRange?.period_start?.date}
                  endDate={dateRange?.period_end?.date}
                  customDateFormat={handleCustomDateFormat}
                />
              )}
              {dateRange && (
                <ChartHandler
                  provider="infra-monitoring"
                  attribute="client_connections_max_limit"
                  label="Client connections - Max limit"
                  // defaultChartStyle="stackedAreaLine"
                  interval={dateRange.interval}
                  startDate={dateRange?.period_start?.date}
                  endDate={dateRange?.period_end?.date}
                  customDateFormat={handleCustomDateFormat}
                />
              )}
            </div>
          </Panel.Content>
        </Panel>

        {dateRange && isReplicaSelected && (
          <Panel title="Replica Information">
            <Panel.Content>
              <div id="replication-lag">
                <ChartHandler
                  startDate={dateRange?.period_start?.date}
                  endDate={dateRange?.period_end?.date}
                  attribute="physical_replication_lag_physical_replica_lag_seconds"
                  label="Replication lag"
                  interval={dateRange.interval}
                  provider="infra-monitoring"
                />
              </div>
            </Panel.Content>
          </Panel>
        )}
      </section>
      <section id="database-size-report">
        <ReportWidget
          isLoading={report.isLoading}
          params={report.params.largeObjects}
          title="Database Size"
          data={report.data.largeObjects || []}
          queryType={'db'}
          resolvedSql={report.largeObjectsSql}
          renderer={(props) => {
            return (
              <div>
                <div className="col-span-4 inline-grid grid-cols-12 gap-12 w-full mt-5">
                  <div className="grid gap-2 col-span-2">
                    <h5 className="text-sm">Space used</h5>
                    <span className="text-lg">{formatBytes(databaseSizeBytes, 2, 'GB')}</span>
                  </div>
                  <div className="grid gap-2 col-span-2">
                    <h5 className="text-sm">Provisioned disk size</h5>
                    <span className="text-lg">{currentDiskSize} GB</span>
                  </div>

                  <div className="col-span-8 text-right">
                    {project?.cloud_provider === 'AWS' ? (
                      <Button asChild type="default">
                        <Link href={`/project/${ref}/settings/compute-and-disk`}>
                          Increase disk size
                        </Link>
                      </Button>
                    ) : (
                      <ButtonTooltip
                        type="default"
                        disabled={!canUpdateDiskSizeConfig}
                        onClick={() => setshowIncreaseDiskSizeModal(true)}
                        tooltip={{
                          content: {
                            side: 'bottom',
                            text: !canUpdateDiskSizeConfig
                              ? 'You need additional permissions to increase the disk size'
                              : undefined,
                          },
                        }}
                      >
                        Increase disk size
                      </ButtonTooltip>
                    )}
                  </div>
                </div>

                <h3 className="mt-8 text-sm">Large Objects</h3>
                {!props.isLoading && props.data.length === 0 && <span>No large objects found</span>}
                {!props.isLoading && props.data.length > 0 && (
                  <Table
                    className="space-y-3 mt-4"
                    head={[
                      <Table.th key="object" className="py-2">
                        Object
                      </Table.th>,
                      <Table.th key="size" className="py-2">
                        Size
                      </Table.th>,
                    ]}
                    body={props.data?.map((object) => {
                      const percentage = (
                        ((object.table_size as number) / databaseSizeBytes) *
                        100
                      ).toFixed(2)

                      return (
                        <Table.tr key={`${object.schema_name}.${object.relname}`}>
                          <Table.td>
                            {object.schema_name}.{object.relname}
                          </Table.td>
                          <Table.td>
                            {formatBytes(object.table_size)} ({percentage}%)
                          </Table.td>
                        </Table.tr>
                      )
                    })}
                  />
                )}
              </div>
            )
          }}
          append={() => (
            <div className="px-6 pb-2">
              <Alert_Shadcn_ variant="default" className="mt-4">
                <AlertDescription_Shadcn_>
                  <div className="space-y-2">
                    <p>
                      New Supabase projects have a database size of ~40-60mb. This space includes
                      pre-installed extensions, schemas, and default Postgres data. Additional
                      database size is used when installing extensions, even if those extensions are
                      inactive.
                    </p>

                    <Button asChild type="default" icon={<ExternalLink />}>
                      <Link
                        href="https://supabase.com/docs/guides/platform/database-size#disk-space-usage"
                        target="_blank"
                        rel="noreferrer"
                      >
                        Read about database size
                      </Link>
                    </Button>
                  </div>
                </AlertDescription_Shadcn_>
              </Alert_Shadcn_>
            </div>
          )}
        />
        <DiskSizeConfigurationModal
          visible={showIncreaseDiskSizeModal}
          loading={isUpdatingDiskSize}
          hideModal={setshowIncreaseDiskSizeModal}
        />
      </section>
    </>
  )
}
