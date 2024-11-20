import dayjs from 'dayjs'
import { ArrowRight, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { AlertDescription_Shadcn_, Alert_Shadcn_, Button } from 'ui'

import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useParams } from 'common'
import ReportHeader from 'components/interfaces/Reports/ReportHeader'
import ReportPadding from 'components/interfaces/Reports/ReportPadding'
import ReportWidget from 'components/interfaces/Reports/ReportWidget'
import DiskSizeConfigurationModal from 'components/interfaces/Settings/Database/DiskSizeConfigurationModal'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import ReportsLayout from 'components/layouts/ReportsLayout/ReportsLayout'
import ChartHandler from 'components/to-be-cleaned/Charts/ChartHandler'
import DateRangePicker from 'components/to-be-cleaned/DateRangePicker'
import Table from 'components/to-be-cleaned/Table'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import Panel from 'components/ui/Panel'
import { useProjectDiskResizeMutation } from 'data/config/project-disk-resize-mutation'
import { useDatabaseSizeQuery } from 'data/database/database-size-query'
import { useDatabaseReport } from 'data/reports/database-report-query'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { useFlag } from 'hooks/ui/useFlag'
import { TIME_PERIODS_INFRA } from 'lib/constants/metrics'
import { formatBytes } from 'lib/helpers'
import { useDatabaseSelectorStateSnapshot } from 'state/database-selector'
import type { NextPageWithLayout } from 'types'

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
  const diskManagementV2 = useFlag('diskManagementV2')

  const org = useSelectedOrganization()
  const state = useDatabaseSelectorStateSnapshot()
  const [dateRange, setDateRange] = useState<any>(undefined)

  const isReplicaSelected = state.selectedDatabaseId !== project?.ref

  const showNewDiskManagementUI = diskManagementV2 && project?.cloud_provider === 'AWS'

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

  return (
    <>
      <ReportHeader showDatabaseSelector title="Database" />
      <section>
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
                <div className="flex items-center gap-x-2">
                  <p className="text-foreground-light">
                    {dayjs(dateRange.period_start.date).format('MMMM D, hh:mma')}
                  </p>
                  <p className="text-foreground-light">
                    <ArrowRight size={12} />
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
                  provider="infra-monitoring"
                  attribute="ram_usage"
                  label="Memory usage"
                  interval={dateRange.interval}
                  startDate={dateRange?.period_start?.date}
                  endDate={dateRange?.period_end?.date}
                />
              )}

              {dateRange && (
                <ChartHandler
                  provider="infra-monitoring"
                  attribute="swap_usage"
                  label="Swap usage"
                  interval={dateRange.interval}
                  startDate={dateRange?.period_start?.date}
                  endDate={dateRange?.period_end?.date}
                />
              )}

              {dateRange && (
                <ChartHandler
                  provider="infra-monitoring"
                  attribute="avg_cpu_usage"
                  label="Average CPU usage"
                  interval={dateRange.interval}
                  startDate={dateRange?.period_start?.date}
                  endDate={dateRange?.period_end?.date}
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
                <p className="text-sm -mt-4 text-foreground-lighter">
                  The data refreshes every 24 hours.
                </p>
                <div className="col-span-4 inline-grid grid-cols-12 gap-12 w-full mt-5">
                  <div className="grid gap-2 col-span-2">
                    <h5 className="text-sm">Space used</h5>
                    <span className="text-lg">{formatBytes(databaseSizeBytes, 2, 'GB')}</span>
                  </div>
                  <div className="grid gap-2 col-span-2">
                    <h5 className="text-sm">Total size</h5>
                    <span className="text-lg">{currentDiskSize} GB</span>
                  </div>

                  <div className="col-span-8 text-right">
                    {showNewDiskManagementUI ? (
                      <Button asChild type="default">
                        <Link href={`/project/${ref}/settings/database#disk-management`}>
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
                        href="https://supabase.com/docs/guides/platform/database-size#database-space-management"
                        target="_blank"
                        rel="noreferrer"
                      >
                        Read about database space
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
