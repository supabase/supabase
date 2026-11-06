import { useQueryClient } from '@tanstack/react-query'
import { useFlag, useParams } from 'common'
import dayjs from 'dayjs'
import { ArrowRightIcon, RefreshCwIcon } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from 'ui'

import { DatabaseSize } from '@/components/interfaces/Observability/DatabaseSize/DatabaseSize'
import { OBSERVABILITY_DOCS_HREFS } from '@/components/interfaces/Observability/Observability.constants'
import ReportHeader from '@/components/interfaces/Reports/ReportHeader'
import { ReportPadding } from '@/components/interfaces/Reports/ReportPadding'
import { REPORT_DATERANGE_HELPER_LABELS } from '@/components/interfaces/Reports/Reports.constants'
import ReportStickyNav from '@/components/interfaces/Reports/ReportStickyNav'
import { ReportChartUpsell } from '@/components/interfaces/Reports/v2/ReportChartUpsell'
import { POOLING_OPTIMIZATIONS } from '@/components/interfaces/Settings/Database/ConnectionPooling/ConnectionPooling.constants'
import DiskSizeConfigurationModal from '@/components/interfaces/Settings/Database/DiskSizeConfigurationModal'
import { getInfrastructurePath } from '@/components/interfaces/Settings/Infrastructure/Infrastructure.utils'
import { LogsDatePicker } from '@/components/interfaces/Settings/Logs/Logs.DatePickers'
import UpgradePrompt from '@/components/interfaces/Settings/Logs/UpgradePrompt'
import { DefaultLayout } from '@/components/layouts/DefaultLayout'
import ObservabilityLayout from '@/components/layouts/ObservabilityLayout/ObservabilityLayout'
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import type { MultiAttribute } from '@/components/ui/Charts/ComposedChart.utils'
import { LazyComposedChartHandler } from '@/components/ui/Charts/ComposedChartHandler'
import { ReportSettings } from '@/components/ui/Charts/ReportSettings'
import { getMemoryCommitmentPreviewData } from '@/components/ui/DevToolbar/MetricsTab.utils'
import { DocsButton } from '@/components/ui/DocsButton'
import { ObservabilityLink } from '@/components/ui/ObservabilityLink'
import { ShortcutTooltip } from '@/components/ui/ShortcutTooltip'
import { analyticsKeys } from '@/data/analytics/keys'
import { useDiskAttributesQuery } from '@/data/config/disk-attributes-query'
import { useProjectDiskResizeMutation } from '@/data/config/project-disk-resize-mutation'
import { databaseKeys } from '@/data/database/keys'
import { useMaxConnectionsQuery } from '@/data/database/max-connections-query'
import { usePgbouncerConfigQuery } from '@/data/database/pgbouncer-config-query'
import { getReportAttributesV2 } from '@/data/reports/database-charts'
import { useProjectAddonsQuery } from '@/data/subscriptions/project-addons-query'
import { useCheckEntitlements } from '@/hooks/misc/useCheckEntitlements'
import { FGA_PERMISSIONS, useAsyncCheckPermissionsV2 } from '@/hooks/misc/useCheckPermissionsV2'
import { useRefreshHandler, useReportDateRange } from '@/hooks/misc/useReportDateRange'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'
import { useIsHighAvailability, useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { useDatabaseSelectorStateSnapshot } from '@/state/database-selector'
import { useMemoryCommitmentPreview } from '@/state/metrics-preview'
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

const REPORT_TITLE = 'Database'
const CHART_LAYOUT_OBSERVATION_DURATION = 10_000
const CHART_LAYOUT_OBSERVATION_CANCEL_EVENTS = [
  'keydown',
  'pointerdown',
  'touchstart',
  'wheel',
] as const

const isChartFullyVisible = (target: HTMLElement) => {
  const targetBounds = target.getBoundingClientRect()
  const scrollContainerBounds = target.closest('main')?.getBoundingClientRect()
  const viewportTop = scrollContainerBounds?.top ?? 0
  const viewportBottom = scrollContainerBounds?.bottom ?? window.innerHeight

  return targetBounds.top >= viewportTop && targetBounds.bottom <= viewportBottom
}

export const useDatabaseChartDeepLink = (chart?: string) => {
  useEffect(() => {
    if (chart === undefined) return

    let chartTargetObserver: MutationObserver | undefined
    let resizeObserver: ResizeObserver | undefined
    let stopObservingTimer: number | undefined

    const stopDeepLink = () => {
      if (stopObservingTimer !== undefined) window.clearTimeout(stopObservingTimer)
      chartTargetObserver?.disconnect()
      resizeObserver?.disconnect()
      CHART_LAYOUT_OBSERVATION_CANCEL_EVENTS.forEach((eventName) =>
        window.removeEventListener(eventName, stopDeepLink, true)
      )
    }

    CHART_LAYOUT_OBSERVATION_CANCEL_EVENTS.forEach((eventName) =>
      window.addEventListener(eventName, stopDeepLink, true)
    )

    const scrollToChart = () => {
      const target = document.getElementById(chart)
      if (target === null) return false

      chartTargetObserver?.disconnect()
      target.scrollIntoView({ behavior: 'smooth', block: 'center' })

      const chartList = target.parentElement
      if (chartList === null) return true

      resizeObserver = new ResizeObserver(() => {
        if (!isChartFullyVisible(target)) {
          target.scrollIntoView({ behavior: 'auto', block: 'center' })
        }
      })
      resizeObserver.observe(chartList)
      stopObservingTimer = window.setTimeout(stopDeepLink, CHART_LAYOUT_OBSERVATION_DURATION)
      return true
    }

    if (!scrollToChart()) {
      chartTargetObserver = new MutationObserver(scrollToChart)
      chartTargetObserver.observe(document.body, { childList: true, subtree: true })
    }

    return stopDeepLink
  }, [chart])
}

export const useDatabaseSelectionFromUrl = (
  db: string | undefined,
  setSelectedDatabaseId: (databaseId: string) => void
) => {
  useEffect(() => {
    if (db === undefined) return

    const timeout = window.setTimeout(() => setSelectedDatabaseId(db), 100)
    return () => window.clearTimeout(timeout)
  }, [db, setSelectedDatabaseId])
}

const DatabaseUsage = () => {
  const { db, chart, ref } = useParams()
  const { data: project } = useSelectedProjectQuery()
  const { data: org } = useSelectedOrganizationQuery()
  const isHighAvailability = useIsHighAvailability()

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

  const { can: canUpdateDiskSizeConfig } = useAsyncCheckPermissionsV2(
    FGA_PERMISSIONS.PROJECT.INFRA_DISK_CONFIG_WRITE
  )

  const { getEntitlementSetValues, isLoading: isEntitlementLoading } = useCheckEntitlements(
    'observability.dashboard_advanced_metrics'
  )
  const entitledFeatures = getEntitlementSetValues()

  const isSpendCapEnabled = entitledFeatures.includes('database') && !org?.usage_billing_enabled

  const showDiskIOBurstBalanceChart = useFlag('showDiskIOBurstBalanceChart')
  const showMemoryCommitmentChart = useFlag('showMemoryCommitmentChart')
  const showMemoryCommitmentRiskZones = useFlag('showMemoryCommitmentRiskZones')
  const memoryCommitmentPreview = useMemoryCommitmentPreview(ref)
  const memoryCommitmentPreviewData = getMemoryCommitmentPreviewData(
    memoryCommitmentPreview,
    selectedDateRange?.period_start?.date,
    selectedDateRange?.period_end?.date
  )

  const REPORT_ATTRIBUTES = getReportAttributesV2(
    entitledFeatures,
    project!,
    diskConfig,
    maxConnections,
    defaultMaxClientConn,
    isSpendCapEnabled,
    showDiskIOBurstBalanceChart,
    showMemoryCommitmentChart,
    showMemoryCommitmentRiskZones
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
      queryClient.invalidateQueries({
        queryKey: databaseKeys.sizeBreakdown(ref, state.selectedDatabaseId ?? project?.ref),
      })
      queryClient.invalidateQueries({
        queryKey: analyticsKeys.infraMonitoringGroup(ref, {
          attributes: ['pg_database_size'],
          startDate: selectedDateRange.period_start.date,
          endDate: selectedDateRange.period_end.date,
          interval: selectedDateRange.interval,
          databaseIdentifier: state.selectedDatabaseId,
        }),
      })
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

  useDatabaseSelectionFromUrl(db, state.setSelectedDatabaseId)

  // Loading charts above the target resize after the first scroll and can push it out of view.
  useDatabaseChartDeepLink(chart)

  return (
    <>
      <ReportHeader showDatabaseSelector title={REPORT_TITLE} />
      <ReportStickyNav
        content={
          <div className="ml-auto flex items-center gap-2 flex-wrap">
            <DocsButton href={OBSERVABILITY_DOCS_HREFS.database} topic={REPORT_TITLE} />
            <ShortcutTooltip
              shortcutId={SHORTCUT_IDS.OBSERVABILITY_REFRESH}
              label="Refresh report"
              side="bottom"
            >
              <Button
                aria-label="Refresh report"
                disabled={isRefreshing}
                icon={<RefreshCwIcon className={isRefreshing ? 'animate-spin' : ''} />}
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
                    <ArrowRightIcon size={12} />
                  </p>
                  <p className="text-foreground-light">
                    {dayjs(selectedDateRange.period_end.date).format('MMM D, h:mma')}
                  </p>
                </div>
              )}
            </div>
          </div>
        }
      >
        {selectedDateRange &&
          REPORT_ATTRIBUTES.filter((chart) => !chart.hide).map((chart) => {
            const chartPreviewData =
              chart.id === 'memory-commitment' ? memoryCommitmentPreviewData : undefined
            const chartAvailable =
              !chart.entitlement ||
              isEntitlementLoading ||
              entitledFeatures.includes(chart.entitlement)
            return chartAvailable ? (
              <LazyComposedChartHandler
                key={chart.id}
                {...chart}
                data={chartPreviewData}
                highlightedValue={chartPreviewData?.at(-1)?.ram_commit_used}
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
      <DatabaseSize
        startDate={selectedDateRange?.period_start.date}
        endDate={selectedDateRange?.period_end.date}
        interval={selectedDateRange?.interval}
        updateDateRange={updateDateRange}
        diskAction={
          project?.cloud_provider === 'AWS' && !isHighAvailability ? (
            <Button asChild>
              <Link href={getInfrastructurePath(ref)}>Increase disk size</Link>
            </Button>
          ) : (
            <ButtonTooltip
              disabled={!canUpdateDiskSizeConfig || isHighAvailability}
              onClick={() => setshowIncreaseDiskSizeModal(true)}
              tooltip={{
                content: {
                  side: 'bottom',
                  text: !canUpdateDiskSizeConfig
                    ? 'You need additional permissions to increase the disk size'
                    : isHighAvailability
                      ? 'Disk size management is unavailable for High Availability projects'
                      : undefined,
                },
              }}
            >
              Increase disk size
            </ButtonTooltip>
          )
        }
      />
      <DiskSizeConfigurationModal
        visible={showIncreaseDiskSizeModal}
        loading={isUpdatingDiskSize}
        hideModal={setshowIncreaseDiskSizeModal}
      />

      <div className="py-8">
        <ObservabilityLink />
      </div>
    </>
  )
}
