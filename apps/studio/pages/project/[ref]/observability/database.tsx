import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useQueryClient } from '@tanstack/react-query'
import { useParams } from 'common'
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
import {
  applyDemoInfrastructureIfUnreliable,
  parseConnectionsData,
  parseInfrastructureMetrics,
} from 'components/interfaces/Observability/DatabaseInfrastructureSection.utils'
import type { InfraMonitoringAttribute } from 'data/analytics/infra-monitoring-query'
import { useInfraMonitoringAttributesQuery } from 'data/analytics/infra-monitoring-query'
import { analyticsKeys } from 'data/analytics/keys'
import { useDiskAttributesQuery } from 'data/config/disk-attributes-query'
import { useProjectDiskResizeMutation } from 'data/config/project-disk-resize-mutation'
import { useDatabaseSizeQuery } from 'data/database/database-size-query'
import { useMaxConnectionsQuery } from 'data/database/max-connections-query'
import { usePgbouncerConfigQuery } from 'data/database/pgbouncer-config-query'
import { useProjectLintsQuery } from 'data/lint/lint-query'
import { getReportAttributesV2 } from 'data/reports/database-charts'
import { useDatabaseReport } from 'data/reports/database-report-query'
import { useProjectAddonsQuery } from 'data/subscriptions/project-addons-query'
import dayjs from 'dayjs'
import { useCheckEntitlements } from 'hooks/misc/useCheckEntitlements'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useRefreshHandler, useReportDateRange } from 'hooks/misc/useReportDateRange'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { DOCS_URL } from 'lib/constants'
import { formatBytes } from 'lib/helpers'
import { ArrowRight, ExternalLink, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { useDatabaseSelectorStateSnapshot } from 'state/database-selector'
import type { NextPageWithLayout } from 'types'
import { Alert_Shadcn_, AlertDescription_Shadcn_, Button } from 'ui'

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

/** Past-24h infra + advisor snapshot for the database observability page (demo fill when telemetry is empty). */
const DatabaseObservabilityHealthSummary = () => {
  const { data: project } = useSelectedProjectQuery()
  const projectRef = project?.ref

  const { startDate, endDate } = useMemo(() => {
    const n = dayjs()
    return { startDate: n.subtract(1, 'day').toISOString(), endDate: n.toISOString() }
  }, [])

  const attributes = useMemo<InfraMonitoringAttribute[]>(
    () => [
      'avg_cpu_usage',
      'ram_usage',
      'disk_fs_used_system',
      'disk_fs_used_wal',
      'pg_database_size',
      'disk_fs_size',
      'disk_io_consumption',
      'pg_stat_database_num_backends',
    ],
    []
  )

  const { data: infraData } = useInfraMonitoringAttributesQuery(
    {
      projectRef,
      attributes,
      startDate,
      endDate,
      interval: '1h',
    },
    { enabled: Boolean(projectRef) }
  )

  const { data: maxConnectionsData } = useMaxConnectionsQuery({
    projectRef,
    connectionString: project?.connectionString,
  })

  const rawMetrics = parseInfrastructureMetrics(infraData)
  const rawConnections = parseConnectionsData(infraData, maxConnectionsData)
  const { metrics, connections, isDemo } = applyDemoInfrastructureIfUnreliable(
    infraData,
    rawMetrics,
    rawConnections
  )

  const lintsQuery = useProjectLintsQuery({ projectRef })
  const lints = lintsQuery.data ?? []

  const secErr = lints.filter((l) => l.categories.includes('SECURITY') && l.level === 'ERROR').length
  const secWarn = lints.filter((l) => l.categories.includes('SECURITY') && l.level === 'WARN').length
  const perfErr = lints.filter((l) => l.categories.includes('PERFORMANCE') && l.level === 'ERROR')
    .length
  const perfWarn = lints.filter((l) => l.categories.includes('PERFORMANCE') && l.level === 'WARN')
    .length
  const advisorNoise = secErr + secWarn + perfErr + perfWarn > 0

  const cpu = metrics.cpu.current
  const ram = metrics.ram.current
  const disk = metrics.disk.current
  const diskIo = metrics.diskIo.current
  const connRatio =
    connections.max > 0 ? connections.current / Math.max(connections.max, 1) : 0

  const pressureSignals = [
    cpu >= 72,
    ram >= 78,
    disk >= 82,
    connRatio >= 0.82,
    diskIo >= 72,
  ].filter(Boolean).length

  let variant: 'default' | 'warning' | 'destructive' = 'default'
  if (secErr > 0 || pressureSignals >= 3) variant = 'destructive'
  else if (perfErr > 0 || pressureSignals >= 1 || advisorNoise) variant = 'warning'

  const title =
    variant === 'destructive'
      ? 'Last 24 hours: review recommended'
      : variant === 'warning'
        ? 'Last 24 hours: monitor metrics below'
        : 'Last 24 hours: metrics look steady'

  let body = ''
  if (isDemo) {
    body +=
      '[Demo sample] Showing illustrative 24h averages because live telemetry had no hourly points yet. '
  }

  body += `Hourly averages over roughly the past day: CPU about ${cpu.toFixed(0)}%, memory about ${ram.toFixed(
    0
  )}%, disk about ${disk.toFixed(0)}% used, disk IO about ${diskIo.toFixed(0)}%. `

  if (connections.max > 0) {
    body += `Database connections averaged near ${connections.current} of ${connections.max}. `
  }

  if (pressureSignals >= 3) {
    body += `Several metrics are high. Review logs and query statistics before you change compute size alone. `
  } else if (pressureSignals === 2) {
    body += `Two metrics are elevated. Review the charts below and related logs. `
  } else if (pressureSignals === 1) {
    body += `One metric is elevated. Track it on the charts below. `
  } else {
    body += `This summary does not show saturation from averages alone. `
  }

  if (secErr > 0) {
    body += `Advisors report ${secErr} security error(s). Review Row Level Security and policies for possible data exposure. `
  } else if (secWarn > 0) {
    body += `Advisors report ${secWarn} security warning(s). Plan updates to access rules as traffic grows. `
  }

  if (perfErr > 0) {
    body += `Advisors report ${perfErr} performance error(s). Address these before you rely on the system under higher load. `
  } else if (perfWarn > 0 && pressureSignals === 0) {
    body += `Advisors report ${perfWarn} performance warning(s). You can schedule fixes during regular maintenance. `
  }

  if (!projectRef) return null

  if (lintsQuery.isLoading) {
    return (
      <Alert_Shadcn_ variant="default" className="mb-4 mx-4 lg:mx-6">
        <AlertDescription_Shadcn_>Loading 24h health summary…</AlertDescription_Shadcn_>
      </Alert_Shadcn_>
    )
  }

  return (
    <Alert_Shadcn_ variant={variant} className="mb-4 mx-4 lg:mx-6">
      <AlertDescription_Shadcn_>
        <p className="font-medium mb-1">{title}</p>
        <p className="text-foreground-light">{body}</p>
      </AlertDescription_Shadcn_>
    </Alert_Shadcn_>
  )
}

const DatabaseUsage = () => {
  const { db, chart, ref } = useParams()
  const { data: project } = useSelectedProjectQuery()
  const { data: org } = useSelectedOrganizationQuery()

  const {
    selectedDateRange,
    updateDateRange,
    datePickerValue,
    datePickerHelpers,
    showUpgradePrompt,
    setShowUpgradePrompt,
    handleDatePickerChange,
  } = useReportDateRange(REPORT_DATERANGE_HELPER_LABELS.LAST_60_MINUTES)

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

  const { getEntitlementSetValues, isLoading: isEntitlementLoading } = useCheckEntitlements(
    'observability.dashboard_advanced_metrics'
  )
  const entitledFeatures = getEntitlementSetValues()

  const isSpendCapEnabled =
    entitledFeatures.includes('database') &&
    !org?.usage_billing_enabled &&
    project?.cloud_provider !== 'FLY'

  const REPORT_ATTRIBUTES = getReportAttributesV2(
    entitledFeatures,
    project!,
    diskConfig,
    maxConnections,
    defaultMaxClientConn,
    isSpendCapEnabled
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
      <DatabaseObservabilityHealthSummary />
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
          REPORT_ATTRIBUTES.filter((chart) => !chart.hide).map((chart) => {
            const chartAvailable =
              !chart.entitlement ||
              isEntitlementLoading ||
              entitledFeatures.includes(chart.entitlement)
            return chartAvailable ? (
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
                report={{ label: chart.label, requiredPlan: chart.requiredPlan }}
                orgSlug={org?.slug ?? ''}
              />
            )
          })}
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
