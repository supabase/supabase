import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useQueryClient } from '@tanstack/react-query'
import { useParams } from 'common'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { DatabaseSelector } from 'components/ui/DatabaseSelector'
import { DateRangePicker } from 'components/ui/DateRangePicker'
import NoPermission from 'components/ui/NoPermission'
import { DEFAULT_CHART_CONFIG } from 'components/ui/QueryBlock/QueryBlock'
import { AnalyticsInterval } from 'data/analytics/constants'
import { analyticsKeys } from 'data/analytics/keys'
import { useContentQuery } from 'data/content/content-query'
import {
  UpsertContentPayload,
  useContentUpsertMutation,
} from 'data/content/content-upsert-mutation'
import { useSendEventMutation } from 'data/telemetry/send-event-mutation'
import dayjs from 'dayjs'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { BASE_PATH } from 'lib/constants'
import { Metric, TIME_PERIODS_REPORTS } from 'lib/constants/metrics'
import { uuidv4 } from 'lib/helpers'
import { useProfile } from 'lib/profile'
import { groupBy, isEqual, isNull } from 'lodash'
import { Plus, RefreshCw, Save } from 'lucide-react'
import { useRouter } from 'next/router'
import { DragEvent, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useDatabaseSelectorStateSnapshot } from 'state/database-selector'
import type { Dashboards } from 'types'
import { Button, cn, DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, LogoLoader } from 'ui'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'

import { createSqlSnippetSkeletonV2 } from '../SQLEditor/SQLEditor.utils'
import { ChartConfig } from '../SQLEditor/UtilityPanel/ChartConfig'
import { GridResize } from './GridResize'
import { MetricOptions } from './MetricOptions'
import { LAYOUT_COLUMN_COUNT } from './Reports.constants'

const DEFAULT_CHART_COLUMN_COUNT = 1
const DEFAULT_CHART_ROW_COUNT = 1

const Reports = () => {
  const router = useRouter()
  const { id: reportId, ref } = useParams()
  const { profile } = useProfile()
  const { data: project } = useSelectedProjectQuery()
  const { data: selectedOrg } = useSelectedOrganizationQuery()
  const queryClient = useQueryClient()
  const state = useDatabaseSelectorStateSnapshot()

  const [isDraggedOver, setIsDraggedOver] = useState(false)
  const [config, setConfig] = useState<Dashboards.Content>()
  const [startDate, setStartDate] = useState<string>()
  const [endDate, setEndDate] = useState<string>()
  const [hasEdits, setHasEdits] = useState<boolean>(false)
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false)

  const [navigateUrl, setNavigateUrl] = useState<string>()
  const [confirmNavigate, setConfirmNavigate] = useState(false)

  const {
    data: userContents,
    isPending: isLoading,
    isSuccess,
  } = useContentQuery({
    projectRef: ref,
    type: 'report',
  })
  const { mutate: upsertContent, isPending: isSaving } = useContentUpsertMutation({
    onSuccess: (_, vars) => {
      setHasEdits(false)
      if (vars.payload.type === 'report') toast.success('Successfully saved report!')
    },
    onError: (error, vars) => {
      if (vars.payload.type === 'report') toast.error(`Failed to update report: ${error.message}`)
    },
  })
  const { mutate: sendEvent } = useSendEventMutation()

  const currentReport = userContents?.content.find((report) => report.id === reportId)
  const currentReportContent = currentReport?.content as Dashboards.Content

  const { can: canReadReport, isLoading: isLoadingPermissions } = useAsyncCheckPermissions(
    PermissionAction.READ,
    'user_content',
    {
      resource: {
        type: 'report',
        visibility: currentReport?.visibility,
        owner_id: currentReport?.owner_id,
      },
      subject: { id: profile?.id },
    }
  )
  const { can: canUpdateReport } = useAsyncCheckPermissions(
    PermissionAction.UPDATE,
    'user_content',
    {
      resource: {
        type: 'report',
        visibility: currentReport?.visibility,
        owner_id: currentReport?.owner_id,
      },
      subject: { id: profile?.id },
    }
  )

  function handleDateRangePicker({ period_start, period_end }: any) {
    setStartDate(period_start.date)
    setEndDate(period_end.date)
  }

  function checkEditState() {
    if (config === undefined) return
    /*
     * Shallow copying the config state variable maintains a reference
     * Instead, we stringify it and parse it again to remove anything
     * that can be mutated at component state level.
     *
     * This allows us to mutate these configs, like removing dates in case we do not
     * want to compare fixed dates as possible differences from saved and edited versions of report.
     */
    let _config = JSON.parse(JSON.stringify(config))
    let _original = JSON.parse(JSON.stringify(currentReportContent))

    if (!_original || !_config) return

    /*
     * Check if the dates are a fixed custom date range
     * if they are not, we remove the dates for the edit check comparison
     *
     * this feature is not yet in use, but if we did use custom fixed date ranges,
     * the below would not need to be run
     */
    if (
      _config.period_start.time_period !== 'custom' ||
      _config.period_end.time_period !== 'custom'
    ) {
      _original.period_start.date = ''
      _config.period_start.date = ''
      _original.period_end.date = ''
      _config.period_end.date = ''
    }

    // Runs comparison
    if (isEqual(_config, _original)) {
      setHasEdits(false)
    } else {
      setHasEdits(true)
    }
  }

  const handleChartSelection = ({
    metric,
    isAddingChart,
  }: {
    metric: Metric
    isAddingChart: boolean
  }) => {
    if (isAddingChart) pushChart({ metric })
    else popChart({ metric })
  }

  const pushChart = ({ metric }: { metric: Metric }) => {
    if (!config) return
    const current = [...config.layout]

    let x = 0
    let y = null

    const chartsByY = groupBy(config.layout, 'y')
    const yValues = Object.keys(chartsByY)
    const isSnippet = metric.key?.startsWith('snippet_')

    if (yValues.length === 0) {
      y = 0
    } else {
      // Find if any row has space to fit in a new chart
      for (const yValue of yValues) {
        const totalWidthTaken = chartsByY[yValue].reduce((a, b) => a + b.w, 0)
        if (LAYOUT_COLUMN_COUNT - totalWidthTaken >= DEFAULT_CHART_COLUMN_COUNT) {
          y = Number(yValue)

          // Given that there can not be any gaps between charts, it's safe to
          // assume that we can set x using the accumulative widths
          x = totalWidthTaken
          break
        }
      }

      // If no rows have space to fit the new chart, bring it to a new row
      if (isNull(y)) {
        y = Number(yValues[yValues.length - 1]) + DEFAULT_CHART_ROW_COUNT
      }
    }

    current.push({
      x,
      y,
      w: DEFAULT_CHART_COLUMN_COUNT,
      h: DEFAULT_CHART_ROW_COUNT,
      id: metric?.id ?? uuidv4(),
      label: metric.label,
      attribute: metric.key as Dashboards.ChartType,
      provider: metric.provider as any,
      chart_type: 'bar',
      ...(isSnippet ? { chartConfig: DEFAULT_CHART_CONFIG } : {}),
    })

    setConfig({
      ...config,
      layout: [...current],
    })
  }

  const popChart = ({ metric }: { metric: Partial<Metric> }) => {
    if (!config) return

    const { key, id } = metric
    const current = [...config.layout]

    const foundIndex = current.findIndex((x) => {
      if (x.attribute === key || x.id === id) return x
    })
    current.splice(foundIndex, 1)
    setConfig({ ...config, layout: [...current] })
  }

  const updateChart = (
    id: string,
    {
      chart,
      chartConfig,
    }: { chart?: Partial<Dashboards.Chart>; chartConfig?: Partial<ChartConfig> }
  ) => {
    const currentChart = config?.layout.find((x) => x.id === id)

    if (currentChart) {
      const updatedChart: Dashboards.Chart = {
        ...currentChart,
        ...(chart ?? {}),
      }
      if (chartConfig) {
        updatedChart.chartConfig = { ...(currentChart?.chartConfig ?? {}), ...chartConfig }
      }

      const foundIndex = config?.layout.findIndex((x) => x.id === id)
      if (config && foundIndex !== undefined && foundIndex >= 0) {
        const updatedLayouts = [...config.layout]
        updatedLayouts[foundIndex] = updatedChart
        setConfig({ ...config, layout: updatedLayouts })
      }
    }
  }

  // Updates the report and reloads the report again
  const onSaveReport = async () => {
    if (ref === undefined) return console.error('Project ref is required')
    if (currentReport === undefined) return console.error('Report is required')
    if (config === undefined) return console.error('Config is required')
    upsertContent({
      projectRef: ref,
      payload: { ...currentReport, content: config },
    })
  }

  const onRefreshReport = () => {
    // [Joshen] Since we can't track individual loading states for each chart
    // so for now we mock a loading state that only lasts for a second
    setIsRefreshing(true)
    const monitoringCharts = config?.layout.filter(
      (x) => x.provider === 'infra-monitoring' || x.provider === 'daily-stats'
    )
    monitoringCharts?.forEach((x) => {
      queryClient.invalidateQueries({
        queryKey: analyticsKeys.infraMonitoring(ref, {
          attribute: x.attribute,
          startDate,
          endDate,
          interval: config?.interval,
          databaseIdentifier: state.selectedDatabaseId,
        }),
      })
    })
    setTimeout(() => setIsRefreshing(false), 1000)
  }

  const onDragOverEmptyState = (event: DragEvent<HTMLDivElement>) => {
    if (event.type === 'dragover' && !isDraggedOver) {
      setIsDraggedOver(true)
    } else if (event.type === 'dragleave' || event.type === 'drop') {
      setIsDraggedOver(false)
    }
    event.stopPropagation()
    event.preventDefault()
  }

  const onDropSQLBlockEmptyState = (event: DragEvent<HTMLDivElement>) => {
    onDragOverEmptyState(event)
    if (!ref) return console.error('Project ref is required')
    if (!profile) return console.error('Profile is required')
    if (!project) return console.error('Project is required')
    if (!config) return console.error('Chart configuration is required')

    const data = event.dataTransfer.getData('application/json')
    if (!data) return

    const queryData = JSON.parse(data)
    const { label, sql, config: sqlConfig } = queryData
    if (!label || !sql) return console.error('SQL and Label required')

    const toastId = toast.loading(`Creating new query: ${label}`)

    const payload = createSqlSnippetSkeletonV2({
      name: label,
      sql,
      owner_id: profile?.id,
      project_id: project?.id,
    }) as UpsertContentPayload

    const updatedLayout = [...config.layout]
    updatedLayout.push({
      id: payload.id,
      label,
      x: 0,
      y: 0,
      chart_type: 'bar',
      attribute: `new_snippet_${payload.id}` as Dashboards.ChartType,
      w: DEFAULT_CHART_COLUMN_COUNT,
      h: DEFAULT_CHART_ROW_COUNT,
      chartConfig: { ...DEFAULT_CHART_CONFIG, ...(sqlConfig ?? {}) },
      provider: undefined as any,
    })

    setConfig({ ...config, layout: [...updatedLayout] })

    upsertContent(
      { projectRef: ref, payload },
      {
        onSuccess: () => {
          toast.success(`Successfully created new query: ${label}`, { id: toastId })
          const finalLayout = updatedLayout.map((x) => {
            if (x.id === payload.id) {
              return { ...x, attribute: `snippet_${payload.id}` as Dashboards.ChartType }
            } else return x
          })
          setConfig({ ...config, layout: finalLayout })
        },
      }
    )
    sendEvent({
      action: 'custom_report_assistant_sql_block_added',
      groups: { project: ref ?? 'Unknown', organization: selectedOrg?.slug ?? 'Unknown' },
    })
  }

  useEffect(() => {
    if (isSuccess && currentReportContent !== undefined) setConfig(currentReportContent)
  }, [isSuccess, currentReportContent])

  useEffect(() => {
    checkEditState()
  }, [config])

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasEdits) {
        e.preventDefault()
        e.returnValue = '' // deprecated, but older browsers still require this
      }
    }

    const handleBrowseAway = (url: string) => {
      if (hasEdits && !confirmNavigate) {
        setNavigateUrl(url)
        throw 'Route change declined' // Just to prevent the route change
      } else {
        setNavigateUrl(undefined)
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    router.events.on('routeChangeStart', handleBrowseAway)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      router.events.off('routeChangeStart', handleBrowseAway)
    }
  }, [hasEdits, confirmNavigate, router])

  if (isLoading || isLoadingPermissions) {
    return <LogoLoader />
  }

  if (!canReadReport) {
    return <NoPermission isFullPage resourceText="access this custom report" />
  }

  return (
    <>
      <div className="flex flex-col space-y-4" style={{ maxHeight: '100%' }}>
        <div className="flex items-center justify-between">
          <div>
            <h1>{currentReport?.name || 'Reports'}</h1>
            <p className="text-foreground-light">{currentReport?.description}</p>
          </div>
          {hasEdits && (
            <div className="flex items-center gap-x-2">
              <Button
                type="default"
                disabled={isSaving}
                onClick={() => setConfig(currentReportContent)}
              >
                Cancel
              </Button>
              <Button
                type="primary"
                icon={<Save />}
                loading={isSaving}
                onClick={() => onSaveReport()}
              >
                Save changes
              </Button>
            </div>
          )}
        </div>
        <div className={cn('mb-4 flex items-center gap-x-3 justify-between')}>
          <div className="flex items-center gap-x-2">
            <ButtonTooltip
              type="default"
              icon={<RefreshCw className={isRefreshing ? 'animate-spin' : ''} />}
              className="w-7"
              disabled={isRefreshing}
              tooltip={{ content: { side: 'bottom', text: 'Refresh report' } }}
              onClick={onRefreshReport}
            />
            <div className="flex items-center gap-x-3">
              <DateRangePicker
                value="7d"
                className="w-48"
                onChange={handleDateRangePicker}
                options={TIME_PERIODS_REPORTS}
                loading={isLoading}
                footer={
                  <div className="px-2 py-1">
                    <p className="text-xs text-foreground-lighter">
                      SQL blocks are independent of the selected date range
                    </p>
                  </div>
                }
              />
            </div>
          </div>

          <div className="flex items-center gap-x-2">
            {canUpdateReport ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button type="default" icon={<Plus />}>
                    <span>Add block</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="bottom" align="center" className="w-44">
                  <MetricOptions config={config} handleChartSelection={handleChartSelection} />
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <ButtonTooltip
                disabled
                type="default"
                icon={<Plus />}
                tooltip={{
                  content: {
                    side: 'bottom',
                    className: 'w-56 text-center',
                    text: 'You need additional permissions to update custom reports',
                  },
                }}
              >
                Add block
              </ButtonTooltip>
            )}
            <DatabaseSelector />
          </div>
        </div>

        {config?.layout !== undefined && config.layout.length === 0 ? (
          <div
            className={cn(
              'flex min-h-full items-center justify-center rounded border-2 border-dashed p-16 border-default transition duration-100',
              isDraggedOver ? 'bg-surface-100' : ''
            )}
            onDragOver={onDragOverEmptyState}
            onDragLeave={onDragOverEmptyState}
            onDrop={onDropSQLBlockEmptyState}
          >
            {canUpdateReport ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button type="default" iconRight={<Plus size={14} />}>
                    Add your first chart
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="bottom" align="center">
                  <MetricOptions config={config} handleChartSelection={handleChartSelection} />
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <p className="text-sm text-foreground-light">No charts set up yet in report</p>
            )}
          </div>
        ) : (
          <div className="relative mb-16 flex-grow">
            {config && startDate && endDate && (
              <GridResize
                startDate={startDate}
                endDate={endDate}
                interval={config.interval as AnalyticsInterval}
                editableReport={config}
                disableUpdate={!canUpdateReport}
                isRefreshing={isRefreshing}
                onRemoveChart={popChart}
                onUpdateChart={updateChart}
                setEditableReport={setConfig}
              />
            )}
          </div>
        )}
      </div>
      <ConfirmationModal
        visible={!!navigateUrl}
        variant="warning"
        title="You have unsaved changes in your report"
        confirmLabel="Confirm"
        onConfirm={() => {
          setConfirmNavigate(true)
          let urlToNavigate = navigateUrl ?? '/'
          if (BASE_PATH && urlToNavigate.startsWith(BASE_PATH)) {
            urlToNavigate = urlToNavigate.slice(BASE_PATH.length) || '/'
          }
          if (!urlToNavigate.startsWith('/')) urlToNavigate = `/${urlToNavigate}`
          setNavigateUrl(undefined)
          router.push(urlToNavigate)
        }}
        onCancel={() => setNavigateUrl(undefined)}
      >
        <p className="text-sm">
          Unsaved changes will be lost, are you sure you want to navigate away?
        </p>
      </ConfirmationModal>
    </>
  )
}

export default Reports
