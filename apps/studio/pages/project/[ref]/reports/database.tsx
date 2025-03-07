import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { ArrowRight, BookOpen, ExternalLink, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { AlertDescription_Shadcn_, AlertTitle_Shadcn_, Alert_Shadcn_, Button, cn } from 'ui'

import { useParams } from 'common'
import ReportHeader from 'components/interfaces/Reports/ReportHeader'
import ReportPadding from 'components/interfaces/Reports/ReportPadding'
import ReportWidget from 'components/interfaces/Reports/ReportWidget'
import DiskSizeConfigurationModal from 'components/interfaces/Settings/Database/DiskSizeConfigurationModal'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import ReportsLayout from 'components/layouts/ReportsLayout/ReportsLayout'
import Table from 'components/to-be-cleaned/Table'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import ChartHandler from 'components/ui/Charts/ChartHandler'
import { DateRangePicker } from 'components/ui/DateRangePicker'
import Panel from 'components/ui/Panel'
import { analyticsKeys } from 'data/analytics/keys'
import { useProjectDiskResizeMutation } from 'data/config/project-disk-resize-mutation'
import { useDatabaseSizeQuery } from 'data/database/database-size-query'
import { useDatabaseReport } from 'data/reports/database-report-query'
import { BASE_PATH } from 'lib/constants'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { TIME_PERIODS_INFRA } from 'lib/constants/metrics'
import { formatBytes } from 'lib/helpers'
import { useDatabaseSelectorStateSnapshot } from 'state/database-selector'
import type { NextPageWithLayout } from 'types'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { useSendEventMutation } from 'data/telemetry/send-event-mutation'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { usePgbouncerConfigQuery } from 'data/database/pgbouncer-config-query'
import { Admonition } from 'ui-patterns'

const DatabaseReport: NextPageWithLayout = () => {
  return (
    <ReportPadding>
      <DatabaseUsage />
    </ReportPadding>
  )
}

DatabaseReport.getLayout = (page) => (
  <DefaultLayout>
    <ReportsLayout title="Database">{page}</ReportsLayout>
  </DefaultLayout>
)

export default DatabaseReport

const DatabaseUsage = () => {
  const { db, chart, ref } = useParams()
  const { project } = useProjectContext()
  const queryClient = useQueryClient()

  const state = useDatabaseSelectorStateSnapshot()
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [dateRange, setDateRange] = useState<any>(undefined)

  const isReplicaSelected = state.selectedDatabaseId !== project?.ref

  const report = useDatabaseReport()
  const { data, params, largeObjectsSql, isLoading, refresh } = report

  const { data: databaseSizeData } = useDatabaseSizeQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })
  const databaseSizeBytes = databaseSizeData ?? 0
  const currentDiskSize = project?.volumeSizeGb ?? 0

  const [showIncreaseDiskSizeModal, setshowIncreaseDiskSizeModal] = useState(false)
  const canUpdateDiskSizeConfig = useCheckPermissions(PermissionAction.UPDATE, 'projects', {
    resource: {
      project_id: project?.id,
    },
  })

  const { data: pgBouncerConfig } = usePgbouncerConfigQuery({
    projectRef: ref ?? 'default',
  })
  const isPgBouncerEnabled = pgBouncerConfig?.pgbouncer_enabled

  const REPORT_ATTRIBUTES = [
    { id: 'ram_usage', label: 'Memory usage', hide: false },
    { id: 'avg_cpu_usage', label: 'Average CPU usage', hide: false },
    { id: 'max_cpu_usage', label: 'Max CPU usage', hide: false },
    { id: 'disk_io_consumption', label: 'Disk IO consumed', hide: false },
    {
      id: 'pg_stat_database_num_backends',
      label: 'Pooler to database connections',
      hide: false,
    },
    {
      id: 'supavisor_connections_active',
      label: 'Client to Supavisor connections',
      hide: false,
    },
    {
      id: 'pgbouncer_pools_client_active_connections',
      label: 'Client to dedicated pooler connections',
      hide: !isPgBouncerEnabled,
    },
  ] as const

  const { isLoading: isUpdatingDiskSize } = useProjectDiskResizeMutation({
    onSuccess: (_, variables) => {
      toast.success(`Successfully updated disk size to ${variables.volumeSize} GB`)
      setshowIncreaseDiskSizeModal(false)
    },
  })

  const onRefreshReport = async () => {
    if (!dateRange) return

    // [Joshen] Since we can't track individual loading states for each chart
    // so for now we mock a loading state that only lasts for a second
    setIsRefreshing(true)
    refresh()
    const { period_start, interval } = dateRange
    REPORT_ATTRIBUTES.forEach((attr) => {
      queryClient.invalidateQueries(
        analyticsKeys.infraMonitoring(ref, {
          attribute: attr?.id,
          startDate: period_start.date,
          endDate: period_start.end,
          interval,
          databaseIdentifier: state.selectedDatabaseId,
        })
      )
    })
    if (isReplicaSelected) {
      queryClient.invalidateQueries(
        analyticsKeys.infraMonitoring(ref, {
          attribute: 'physical_replication_lag_physical_replica_lag_seconds',
          startDate: period_start.date,
          endDate: period_start.end,
          interval,
          databaseIdentifier: state.selectedDatabaseId,
        })
      )
    }
    setTimeout(() => setIsRefreshing(false), 1000)
  }

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
      <Alert_Shadcn_ className="relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src={`${BASE_PATH}/img/reports/bg-grafana-dark.svg`}
            alt="Supabase Grafana"
            className="w-full h-full object-cover object-right hidden dark:block"
          />
          <img
            src={`${BASE_PATH}/img/reports/bg-grafana-light.svg`}
            alt="Supabase Grafana"
            className="w-full h-full object-cover object-right dark:hidden"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background-alternative to-transparent" />
        </div>
        <svg
          width="78"
          height="86"
          viewBox="0 0 78 86"
          className="w-4 h-4"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M77.777 38.148c-.15-1.344-.299-2.987-.896-4.778-.448-1.792-1.194-3.733-2.24-5.823-1.045-2.09-2.388-4.18-4.03-6.27-.598-.747-1.344-1.643-2.24-2.39 1.194-4.777-1.493-8.808-1.493-8.808-4.48-.299-7.465 1.343-8.51 2.24-.15 0-.3-.15-.598-.3a41.262 41.262 0 0 0-2.388-.895c-.896-.299-1.643-.448-2.538-.747-.896-.15-1.792-.298-2.539-.448h-.448C47.917 3.66 42.243.971 42.243.971c-6.27 4.031-7.465 9.556-7.465 9.556v.298c-.299.15-.747.15-1.045.299-.448.15-.896.298-1.493.448-.448.149-.896.298-1.493.597-.896.448-1.941.896-2.837 1.344-.896.447-1.792 1.045-2.688 1.642-.149 0-.149-.15-.149-.15-8.809-3.284-16.572.747-16.572.747-.747 9.257 3.434 15.229 4.33 16.274-.15.597-.448 1.194-.598 1.792-.597 2.09-1.194 4.33-1.493 6.57 0 .298-.15.596-.15.895C2.529 45.314.14 53.526.14 53.526c6.718 7.763 14.631 8.211 14.631 8.211 1.045 1.792 2.09 3.434 3.434 5.077.597.597 1.195 1.343 1.643 1.94-2.39 7.018.298 12.84.298 12.84 7.465.3 12.392-3.284 13.437-4.18.747.299 1.493.448 2.24.747 2.24.597 4.628.895 7.017 1.045h2.837c3.583 5.076 9.705 5.822 9.705 5.822 4.479-4.628 4.628-9.256 4.628-10.302v-.299c.896-.596 1.791-1.343 2.688-2.09 1.791-1.642 3.284-3.433 4.628-5.374.15-.15.298-.299.298-.597 5.077.298 8.51-3.136 8.51-3.136-.895-5.225-3.882-7.763-4.479-8.211h-.149V48.748c-.15-.597-.15-1.194-.298-1.642-.597-2.24-1.344-4.33-2.538-6.271-1.195-1.941-2.539-3.583-4.181-5.076-1.642-1.493-3.434-2.538-5.375-3.434-1.94-.896-3.882-1.344-5.972-1.643-1.045-.149-1.94-.149-2.986-.149H48.663c-.448 0-1.045.15-1.493.15a14.617 14.617 0 0 0-5.524 2.09c-1.643 1.045-3.136 2.24-4.33 3.583-1.195 1.344-2.09 2.986-2.688 4.628-.597 1.643-.895 3.285-1.045 4.927V48.3c.15.746.299 1.643.448 2.389.448 1.493 1.195 2.837 1.941 4.03.896 1.196 1.941 2.091 2.986 2.838 1.045.746 2.24 1.343 3.434 1.642 1.195.299 2.24.448 3.434.448H47.767c.15 0 .299 0 .448-.15.298 0 .448-.148.747-.148.448-.15.895-.3 1.343-.598.448-.15.747-.448 1.195-.746.149 0 .15-.15.298-.299.448-.299.448-.896.15-1.194-.299-.299-.747-.448-1.045-.15-.15 0-.15.15-.299.15-.299.149-.597.298-1.045.447-.299.15-.747.15-1.045.299h-2.389c-.896-.15-1.643-.299-2.538-.746-.896-.299-1.643-.896-2.39-1.493-.746-.598-1.343-1.493-1.79-2.24-.448-.746-.897-1.792-1.046-2.836-.15-.448-.15-1.046-.15-1.494v-.746c0-.299 0-.598.15-.896a11.78 11.78 0 0 1 3.285-6.121c.448-.448.895-.747 1.343-1.195.448-.298 1.046-.597 1.493-.896.598-.298 1.195-.447 1.643-.597.597-.15 1.194-.298 1.791-.298h1.792c.597 0 1.344.149 1.94.298 1.345.299 2.539.747 3.734 1.493 2.388 1.344 4.33 3.434 5.673 5.823.597 1.194 1.045 2.538 1.344 3.882 0 .299.149.747.149 1.045V52.63c0 .448 0 .746-.15 1.194 0 .299-.149.747-.149 1.045 0 .299-.149.747-.298 1.046-.15.746-.448 1.492-.747 2.09a27.148 27.148 0 0 1-2.24 4.03c-1.79 2.39-4.18 4.48-7.016 5.674-1.344.598-2.837 1.045-4.33 1.344-.747.15-1.493.15-2.24.299H43.14c-1.642-.15-3.285-.448-4.778-.896-1.493-.448-3.135-1.045-4.479-1.792-2.837-1.493-5.375-3.583-7.465-6.121-1.045-1.194-1.941-2.538-2.538-4.031a28.024 28.024 0 0 1-1.792-4.48c-.448-1.492-.746-3.135-.746-4.628V44.567c0-.746.149-1.642.149-2.388.15-.747.299-1.643.448-2.389.15-.747.298-1.642.597-2.389.448-1.493 1.045-2.986 1.642-4.48 1.344-2.836 2.986-5.374 5.077-7.315.447-.448 1.045-1.045 1.642-1.493.597-.448 1.194-.896 1.792-1.194.597-.448 1.194-.747 1.791-1.046l.896-.447c.15 0 .299-.15.448-.15.15 0 .298-.149.448-.149.597-.299 1.344-.448 1.94-.746.15 0 .3-.15.449-.15.149 0 .299-.15.448-.15.298-.148.746-.148 1.045-.298.149 0 .298-.149.597-.149.15 0 .298 0 .597-.15.15 0 .299 0 .597-.149h.597c.15 0 .299 0 .598-.149.15 0 .448 0 .597-.15h5.225c1.344 0 2.688.15 4.032.449 2.538.448 4.927 1.343 7.166 2.389a23.309 23.309 0 0 1 5.823 3.881l.299.299.298.299c.15.149.448.298.597.597.15.298.448.298.598.597.149.299.448.448.597.597a15.109 15.109 0 0 1 1.94 2.39c1.195 1.492 2.24 3.134 2.987 4.627 0 .15.15.15.15.3 0 .148.148.148.148.298.15.149.15.298.299.597.15.15.15.298.299.597.149.15.149.299.298.597.3.747.598 1.344.747 1.941.298 1.045.597 1.941.746 2.688.15.298.448.597.747.448.298 0 .597-.299.597-.598.597-1.791.597-2.837.448-3.882Z"
            fill="currentColor"
          />
        </svg>

        <div className="flex flex-col md:flex-row gap-2 mt-1">
          <AlertTitle_Shadcn_ className="flex-grow">Advanced observability</AlertTitle_Shadcn_>
          <GrafanaBannerActions className="hidden xl:flex" />
        </div>
        <AlertDescription_Shadcn_ className="relative flex flex-col xl:flex-row gap-2 md:max-w-lg">
          <p className="flex-grow">
            Set up the Supabase Grafana Dashboard to visualize over 200 database performance and
            health metrics on your Supabase project.
          </p>
          <GrafanaBannerActions className="xl:hidden" />
        </AlertDescription_Shadcn_>
      </Alert_Shadcn_>
      <section>
        <Panel title={<h2>Database health</h2>}>
          <Panel.Content>
            <div className="mb-4 flex items-center gap-x-2">
              <ButtonTooltip
                type="default"
                disabled={isRefreshing}
                icon={<RefreshCw className={isRefreshing ? 'animate-spin' : ''} />}
                className="w-7"
                tooltip={{ content: { side: 'bottom', text: 'Refresh report' } }}
                onClick={onRefreshReport}
              />
              <div className="flex items-center gap-x-3">
                <DateRangePicker
                  loading={false}
                  value={'7d'}
                  options={TIME_PERIODS_INFRA}
                  currentBillingPeriodStart={undefined}
                  onChange={(values) => {
                    if (values.interval === '1d') {
                      setDateRange({ ...values, interval: '1h' })
                    } else {
                      setDateRange(values)
                    }
                  }}
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
            </div>
            <div className="space-y-6">
              {dateRange &&
                REPORT_ATTRIBUTES.filter((attr) => !attr.hide).map((attr) => (
                  <>
                    <ChartHandler
                      key={attr.id}
                      provider="infra-monitoring"
                      attribute={attr.id}
                      label={attr.label}
                      interval={dateRange.interval}
                      startDate={dateRange?.period_start?.date}
                      endDate={dateRange?.period_end?.date}
                    />
                    {attr.id === 'pgbouncer_pools_client_active_connections' && (
                      <Admonition type="note" title="Dedicated Pooler is enabled" className="p-2">
                        <p>
                          Your project is currently using the Dedicated Pooler instead of Supavisor.
                          You can update this in{' '}
                          <Link href={`/project/${ref}/settings/database`}>Database settings</Link>.
                        </p>
                      </Admonition>
                    )}
                  </>
                ))}
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
          isLoading={isLoading}
          params={params.largeObjects}
          title="Database Size"
          data={data.largeObjects || []}
          queryType={'db'}
          resolvedSql={largeObjectsSql}
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

const GrafanaBannerActions = ({ className }: { className?: string }) => {
  const { ref } = useParams()
  const org = useSelectedOrganization()
  const { mutate: sendEvent } = useSendEventMutation()

  return (
    <div className={cn('flex gap-2', className)}>
      <Button type="outline" className="bg-alternative" size="tiny" icon={<BookOpen />} asChild>
        <Link
          href="https://supabase.com/docs/guides/telemetry/metrics"
          target="_blank"
          onClick={() =>
            sendEvent({
              action: 'reports_database_grafana_banner_clicked',
              groups: { project: ref ?? 'Unknown', organization: org?.slug ?? 'Unknown' },
            })
          }
        >
          Docs
        </Link>
      </Button>
      <Button type="default" size="tiny" asChild>
        <Link
          href="https://github.com/supabase/supabase-grafana"
          target="_blank"
          onClick={() =>
            sendEvent({
              action: 'reports_database_grafana_banner_clicked',
              groups: { project: ref ?? 'Unknown', organization: org?.slug ?? 'Unknown' },
            })
          }
        >
          Configure Grafana
        </Link>
      </Button>
    </div>
  )
}
