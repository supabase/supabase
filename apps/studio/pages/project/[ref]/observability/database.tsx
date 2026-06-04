import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useQueryClient } from '@tanstack/react-query'
import { useFlag, useParams } from 'common'
import dayjs from 'dayjs'
import { ArrowRight, RefreshCw } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Button } from 'ui'

import { DatabaseSizeWidget } from '@/components/interfaces/Reports/DatabaseSizeWidget'
import ReportHeader from '@/components/interfaces/Reports/ReportHeader'
import ReportPadding from '@/components/interfaces/Reports/ReportPadding'
import { REPORT_DATERANGE_HELPER_LABELS } from '@/components/interfaces/Reports/Reports.constants'
import ReportStickyNav from '@/components/interfaces/Reports/ReportStickyNav'
import { ReportChartUpsell } from '@/components/interfaces/Reports/v2/ReportChartUpsell'
import { POOLING_OPTIMIZATIONS } from '@/components/interfaces/Settings/Database/ConnectionPooling/ConnectionPooling.constants'
import { LogsDatePicker } from '@/components/interfaces/Settings/Logs/Logs.DatePickers'
import UpgradePrompt from '@/components/interfaces/Settings/Logs/UpgradePrompt'
import DefaultLayout from '@/components/layouts/DefaultLayout'
import ObservabilityLayout from '@/components/layouts/ObservabilityLayout/ObservabilityLayout'
import type { MultiAttribute } from '@/components/ui/Charts/ComposedChart.utils'
import { LazyComposedChartHandler } from '@/components/ui/Charts/ComposedChartHandler'
import { ReportSettings } from '@/components/ui/Charts/ReportSettings'
import { ObservabilityLink } from '@/components/ui/ObservabilityLink'
import { ShortcutTooltip } from '@/components/ui/ShortcutTooltip'
import { analyticsKeys } from '@/data/analytics/keys'
import { useDiskAttributesQuery } from '@/data/config/disk-attributes-query'
import { useProjectDiskResizeMutation } from '@/data/config/project-disk-resize-mutation'
import { useDatabaseSizeQuery } from '@/data/database/database-size-query'
import { useMaxConnectionsQuery } from '@/data/database/max-connections-query'
import { usePgbouncerConfigQuery } from '@/data/database/pgbouncer-config-query'
import { getReportAttributesV2 } from '@/data/reports/database-charts'
import { useDatabaseReport } from '@/data/reports/database-report-query'
import { useProjectAddonsQuery } from '@/data/subscriptions/project-addons-query'
import { useCheckEntitlements } from '@/hooks/misc/useCheckEntitlements'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'
import { useRefreshHandler, useReportDateRange } from '@/hooks/misc/useReportDateRange'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { useDatabaseSelectorStateSnapshot } from '@/state/database-selector'
import { SHORTCUT_IDS } from '@/state/shortcuts/registry'
import { useShortcut } from '@/state/shortcuts/useShortcut'
import type { NextPageWithLayout } from '@/types'

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
  const [showDatePicker, setShowDatePicker] = useState(false)

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
  usePgbouncerConfigQuery({ projectRef: project?.ref })

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

  const showDiskIOBurstBalanceChart = useFlag('showDiskIOBurstBalanceChart')

  const REPORT_ATTRIBUTES = getReportAttributesV2(
    entitledFeatures,
    project!,
    diskConfig,
    maxConnections,
    defaultMaxClientConn,
    isSpendCapEnabled,
    showDiskIOBurstBalanceChart
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

  useShortcut(SHORTCUT_IDS.OBSERVABILITY_REFRESH, onRefreshReport, {
    enabled: !isRefreshing,
  })
  useShortcut(SHORTCUT_IDS.OBSERVABILITY_TOGGLE_DATE_PICKER, () => {
    setShowDatePicker((open) => !open)
  })

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
            <ShortcutTooltip
              shortcutId={SHORTCUT_IDS.OBSERVABILITY_REFRESH}
              label="Refresh report"
              side="bottom"
            >
              <Button
                type="default"
                disabled={isRefreshing}
                icon={<RefreshCw className={isRefreshing ? 'animate-spin' : ''} />}
                className="w-7"
                onClick={onRefreshReport}
              />
            </ShortcutTooltip>
            <ReportSettings chartId="database-charts" />
            <div className="flex items-center gap-3">
              <LogsDatePicker
                onSubmit={handleDatePickerChange}
                value={datePickerValue}
                helpers={datePickerHelpers}
                open={showDatePicker}
                onOpenChange={setShowDatePicker}
                shortcutId={SHORTCUT_IDS.OBSERVABILITY_TOGGLE_DATE_PICKER}
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
          <LazyComposedChartHandler
            id="replication-lag"
            label="Replication lag"
            format="s"
            valuePrecision={2}
            showTooltip
            YAxisProps={{
              width: 50,
              tickFormatter: (value: number) => `${value}s`,
            }}
            attributes={[
              {
                attribute: 'physical_replication_lag_physical_replication_lag_seconds',
                provider: 'infra-monitoring',
                label: 'Replication lag',
                tooltip:
                  'Seconds the read replica is behind its primary. Sustained or growing lag may indicate the replica cannot keep up with write throughput',
              },
            ]}
            interval={selectedDateRange.interval}
            startDate={selectedDateRange?.period_start?.date}
            endDate={selectedDateRange?.period_end?.date}
            updateDateRange={updateDateRange}
            defaultChartStyle="line"
            syncId="database-charts"
          />
        )}
      </ReportStickyNav>
      <DatabaseSizeWidget
        isLoading={isLoading}
        params={params.largeObjects}
        data={data.largeObjects || []}
        resolvedSql={largeObjectsSql}
        databaseSizeBytes={databaseSizeBytes}
        currentDiskSize={currentDiskSize}
        projectRef={ref}
        cloudProvider={project?.cloud_provider}
        canUpdateDiskSizeConfig={canUpdateDiskSizeConfig}
        showIncreaseDiskSizeModal={showIncreaseDiskSizeModal}
        isUpdatingDiskSize={isUpdatingDiskSize}
        setShowIncreaseDiskSizeModal={setshowIncreaseDiskSizeModal}
      />
      <div className="py-8">
        <ObservabilityLink />
      </div>
    </>
  )
}
