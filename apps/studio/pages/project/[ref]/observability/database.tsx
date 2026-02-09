import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { ArrowRight, ExternalLink, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

import { useFlag, useParams } from 'common'
import ReportHeader from 'components/interfaces/Reports/ReportHeader'
import ReportPadding from 'components/interfaces/Reports/ReportPadding'
import { REPORT_DATERANGE_HELPER_LABELS } from 'components/interfaces/Reports/Reports.constants'
import ReportStickyNav from 'components/interfaces/Reports/ReportStickyNav'
import ReportWidget from 'components/interfaces/Reports/ReportWidget'
import { ReportChartUpsell } from 'components/interfaces/Reports/v2/ReportChartUpsell'
import { POOLING_OPTIMIZATIONS } from 'components/interfaces/Settings/Database/ConnectionPooling/ConnectionPooling.constants'
import DiskSizeConfigurationModal from 'components/interfaces/Settings/Database/DiskSizeConfigurationModal'
import { LogsDatePicker } from 'components/interfaces/Settings/Logs/Logs.DatePickers'
import UpgradePrompt from 'components/interfaces/Settings/Logs/UpgradePrompt'
import DefaultLayout from 'components/layouts/DefaultLayout'
import ObservabilityLayout from 'components/layouts/ObservabilityLayout/ObservabilityLayout'
import Table from 'components/to-be-cleaned/Table'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import ChartHandler from 'components/ui/Charts/ChartHandler'
import type { MultiAttribute } from 'components/ui/Charts/ComposedChart.utils'
import { LazyComposedChartHandler } from 'components/ui/Charts/ComposedChartHandler'
import { ReportSettings } from 'components/ui/Charts/ReportSettings'
import { ObservabilityLink } from 'components/ui/ObservabilityLink'
import Panel from 'components/ui/Panel'
import { analyticsKeys } from 'data/analytics/keys'
import { useDiskAttributesQuery } from 'data/config/disk-attributes-query'
import { useProjectDiskResizeMutation } from 'data/config/project-disk-resize-mutation'
import { useDatabaseSizeQuery } from 'data/database/database-size-query'
import { useMaxConnectionsQuery } from 'data/database/max-connections-query'
import { usePgbouncerConfigQuery } from 'data/database/pgbouncer-config-query'
import { getReportAttributesV2 } from 'data/reports/database-charts'
import { useDatabaseReport } from 'data/reports/database-report-query'
import { useProjectAddonsQuery } from 'data/subscriptions/project-addons-query'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useRefreshHandler, useReportDateRange } from 'hooks/misc/useReportDateRange'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { DOCS_URL } from 'lib/constants'
import { formatBytes } from 'lib/helpers'
import { useDatabaseSelectorStateSnapshot } from 'state/database-selector'
import type { NextPageWithLayout } from 'types'
import { AlertDescription_Shadcn_, Alert_Shadcn_, Button } from 'ui'

const DatabaseReport: NextPageWithLayout = () => {
  return (
    <ReportPadding>
      <DatabaseUsage />
    </ReportPadding>
  )
}

DatabaseReport.getLayout = (page) => (
  <DefaultLayout>
    <ObservabilityLayout title="Database">{page}</ObservabilityLayout>
  </DefaultLayout>
)

export type UpdateDateRange = (from: string, to: string) => void
export default DatabaseReport

const DatabaseUsage = () => {
  const { db, chart, ref } = useParams()
  const { data: project } = useSelectedProjectQuery()
  const { data: org } = useSelectedOrganizationQuery()
  const reportGranularityV2 = useFlag('reportGranularityV2')

  const {
    selectedDateRange,
    updateDateRange,
    datePickerValue,
    datePickerHelpers,
    orgPlan,
    showUpgradePrompt,
    setShowUpgradePrompt,
    handleDatePickerChange,
  } = useReportDateRange(REPORT_DATERANGE_HELPER_LABELS.LAST_60_MINUTES, reportGranularityV2)

  const state = useDatabaseSelectorStateSnapshot()
  const queryClient = useQueryClient()

  const [isRefreshing, setIsRefreshing] = useState(false)
  const [showIncreaseDiskSizeModal, setshowIncreaseDiskSizeModal] = useState(false)

  const isReplicaSelected = state.selectedDatabaseId !== project?.ref

  const report = useDatabaseReport()
  const { data, params, largeObjectsSql, isPending: isLoading, refresh } = report

  const { data: databaseSizeData } = useDatabaseSizeQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString || undefined,
  })
  const databaseSizeBytes = databaseSizeData ?? 0
  const currentDiskSize = project?.volumeSizeGb ?? 0

  const { data: diskConfig } = useDiskAttributesQuery({ projectRef: project?.ref })
  const { data: maxConnections } = useMaxConnectionsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })
  const { data: poolerConfig } = usePgbouncerConfigQuery({ projectRef: project?.ref })

  // PGBouncer connections
  const { data: addons } = useProjectAddonsQuery({ projectRef: project?.ref })
  const computeInstance = addons?.selected_addons.find((addon) => addon.type === 'compute_instance')
  const poolingOptimizations =
    POOLING_OPTIMIZATIONS[
      (computeInstance?.variant.identifier as keyof typeof POOLING_OPTIMIZATIONS) ??
        (project?.infra_compute_size === 'nano' ? 'ci_nano' : 'ci_micro')
    ]
  const defaultMaxClientConn = poolingOptimizations.maxClientConn ?? 200

  const { can: canUpdateDiskSizeConfig } = useAsyncCheckPermissions(
    PermissionAction.UPDATE,
    'projects',
    {
      resource: {
        project_id: project?.id,
      },
    }
  )

  const REPORT_ATTRIBUTES = getReportAttributesV2(
    org!,
    project!,
    diskConfig,
    maxConnections,
    defaultMaxClientConn
  )

  const { isPending: isUpdatingDiskSize } = useProjectDiskResizeMutation({
    onSuccess: (_, variables) => {
      toast.success(`Successfully updated disk size to ${variables.volumeSize} GB`)
      setshowIncreaseDiskSizeModal(false)
    },
  })

  const onRefreshReport = useRefreshHandler(
    datePickerValue,
    datePickerHelpers,
    handleDatePickerChange,
    async () => {
      if (!selectedDateRange) return

      setIsRefreshing(true)
      refresh()
      const { period_start, period_end, interval } = selectedDateRange

      REPORT_ATTRIBUTES.flatMap((chart) => chart.attributes || [])
        .filter((attr): attr is MultiAttribute => attr !== false)
        .forEach((attr) => {
          queryClient.invalidateQueries({
            queryKey: analyticsKeys.infraMonitoring(ref, {
              attribute: attr.attribute,
              startDate: period_start.date,
              endDate: period_end.date,
              interval,
              databaseIdentifier: state.selectedDatabaseId,
            }),
          })
        })

      if (isReplicaSelected) {
        queryClient.invalidateQueries({
          queryKey: analyticsKeys.infraMonitoring(ref, {
            attribute: 'physical_replication_lag_physical_replication_lag_seconds',
            startDate: period_start.date,
            endDate: period_end.date,
            interval,
            databaseIdentifier: state.selectedDatabaseId,
          }),
        })
      }
      setTimeout(() => setIsRefreshing(false), 1000)
    }
  )

  const stateSyncedFromUrlRef = useRef(false)
  useEffect(() => {
    if (stateSyncedFromUrlRef.current) return
    stateSyncedFromUrlRef.current = true

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
  }, [db, chart, state])

  return (
    <>
      <ReportHeader showDatabaseSelector title="Database" />
      <ReportStickyNav
        content={
          <>
            <ButtonTooltip
              type="default"
              disabled={isRefreshing}
              icon={<RefreshCw className={isRefreshing ? 'animate-spin' : ''} />}
              className="w-7"
              tooltip={{ content: { side: 'bottom', text: 'Refresh report' } }}
              onClick={onRefreshReport}
            />
            <ReportSettings chartId="database-charts" />
            <div className="flex items-center gap-3">
              <LogsDatePicker
                onSubmit={handleDatePickerChange}
                value={datePickerValue}
                helpers={datePickerHelpers}
              />
              <UpgradePrompt
                show={showUpgradePrompt}
                setShowUpgradePrompt={setShowUpgradePrompt}
                title="Report date range"
                description="Report data can be stored for a maximum of 3 months depending on the plan that your project is on."
                source="databaseReportDateRange"
              />
              {selectedDateRange && (
                <div className="flex items-center gap-x-2 text-xs">
                  <p className="text-foreground-light">
                    {dayjs(selectedDateRange.period_start.date).format('MMM D, h:mma')}
                  </p>
                  <p className="text-foreground-light">
                    <ArrowRight size={12} />
                  </p>
                  <p className="text-foreground-light">
                    {dayjs(selectedDateRange.period_end.date).format('MMM D, h:mma')}
                  </p>
                </div>
              )}
            </div>
          </>
        }
      >
        {selectedDateRange &&
          orgPlan?.id &&
          REPORT_ATTRIBUTES.filter((chart) => !chart.hide).map((chart) =>
            chart.availableIn?.includes(orgPlan?.id) ? (
              <LazyComposedChartHandler
                key={chart.id}
                {...chart}
                attributes={chart.attributes as MultiAttribute[]}
                interval={selectedDateRange.interval}
                startDate={selectedDateRange?.period_start?.date}
                endDate={selectedDateRange?.period_end?.date}
                updateDateRange={updateDateRange}
                defaultChartStyle={chart.defaultChartStyle as 'line' | 'bar' | 'stackedAreaLine'}
                syncId="database-charts"
                showMaxValue={
                  chart.id === 'client-connections' ||
                  chart.id === 'client-connections-basic' ||
                  chart.id === 'pgbouncer-connections'
                    ? true
                    : chart.showMaxValue
                }
              />
            ) : (
              <ReportChartUpsell
                key={chart.id}
                report={{
                  label: chart.label,
                  availableIn: chart.availableIn ?? [],
                }}
                orgSlug={org?.slug ?? ''}
              />
            )
          )}
        {selectedDateRange && isReplicaSelected && (
          <Panel title="Replica Information">
            <Panel.Content>
              <div id="replication-lag">
                <ChartHandler
                  startDate={selectedDateRange?.period_start?.date}
                  endDate={selectedDateRange?.period_end?.date}
                  attribute="physical_replication_lag_physical_replication_lag_seconds"
                  label="Replication lag"
                  interval={selectedDateRange.interval}
                  provider="infra-monitoring"
                  syncId="database-charts"
                />
              </div>
            </Panel.Content>
          </Panel>
        )}
      </ReportStickyNav>
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
                  <div className="grid gap-2 col-span-4 xl:col-span-2">
                    <h5>Space used</h5>
                    <span className="text-lg">{formatBytes(databaseSizeBytes, 2, 'GB')}</span>
                  </div>
                  <div className="grid gap-2 col-span-4 xl:col-span-3">
                    <h5>Provisioned disk size</h5>
                    <span className="text-lg">{currentDiskSize} GB</span>
                  </div>

                  <div className="col-span-full lg:col-span-4 xl:col-span-7 lg:text-right">
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
            <div className="px-6 pb-6">
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
                        href={`${DOCS_URL}/guides/platform/database-size#disk-space-usage`}
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
      <div className="py-8">
        <ObservabilityLink />
      </div>
    </>
  )
}
