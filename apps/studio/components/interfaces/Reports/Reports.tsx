import { PermissionAction } from '@supabase/shared-types/out/constants'
import dayjs from 'dayjs'
import { groupBy, isEqual, isNull } from 'lodash'
import { ArrowRight, Plus, Save } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { useParams } from 'common'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import DatabaseSelector from 'components/ui/DatabaseSelector'
import { DateRangePicker } from 'components/ui/DateRangePicker'
import { Loading } from 'components/ui/Loading'
import NoPermission from 'components/ui/NoPermission'
import { DEFAULT_CHART_CONFIG } from 'components/ui/QueryBlock/QueryBlock'
import { AnalyticsInterval } from 'data/analytics/constants'
import { useContentQuery } from 'data/content/content-query'
import { useContentUpsertMutation } from 'data/content/content-upsert-mutation'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { Metric, TIME_PERIODS_REPORTS } from 'lib/constants/metrics'
import { uuidv4 } from 'lib/helpers'
import { useProfile } from 'lib/profile'
import { Dashboards } from 'types'
import { Button, cn, DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from 'ui'
import { ChartConfig } from '../SQLEditor/UtilityPanel/ChartConfig'
import { GridResize } from './GridResize'
import { MetricOptions } from './MetricOptions'
import { LAYOUT_COLUMN_COUNT } from './Reports.constants'

const DEFAULT_CHART_COLUMN_COUNT = 1
const DEFAULT_CHART_ROW_COUNT = 1

const Reports = () => {
  const { id, ref } = useParams()
  const { profile } = useProfile()

  const [config, setConfig] = useState<Dashboards.Content>()
  const [startDate, setStartDate] = useState<string>()
  const [endDate, setEndDate] = useState<string>()
  const [hasEdits, setHasEdits] = useState<boolean>(false)

  const {
    data: userContents,
    isLoading,
    isSuccess,
  } = useContentQuery({
    projectRef: ref,
    type: 'report',
  })
  const { mutate: upsertContent, isLoading: isSaving } = useContentUpsertMutation({
    onSuccess: () => {
      setHasEdits(false)
      toast.success('Successfully saved report!')
    },
    onError: (error) => {
      toast.error(`Failed to update report: ${error.message}`)
    },
  })

  const currentReport = userContents?.content.find((report) => report.id === id)
  const currentReportContent = currentReport?.content as Dashboards.Content

  const canReadReport = useCheckPermissions(PermissionAction.READ, 'user_content', {
    resource: {
      type: 'report',
      visibility: currentReport?.visibility,
      owner_id: currentReport?.owner_id,
    },
    subject: { id: profile?.id },
  })
  const canUpdateReport = useCheckPermissions(PermissionAction.UPDATE, 'user_content', {
    resource: {
      type: 'report',
      visibility: currentReport?.visibility,
      owner_id: currentReport?.owner_id,
    },
    subject: { id: profile?.id },
  })

  function handleDateRangePicker({ period_start, period_end }: any) {
    setStartDate(period_start.date)
    setEndDate(period_end.date)
  }

  function checkEditState() {
    if (config === undefined) return
    /*
     * Shallow copying the config state variable maintains a mobx reference
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

  useEffect(() => {
    if (isSuccess && currentReportContent !== undefined) setConfig(currentReportContent)
  }, [isSuccess, currentReportContent])

  useEffect(() => {
    checkEditState()
  }, [config])

  if (isLoading) {
    return <Loading />
  }

  if (!canReadReport) {
    return <NoPermission isFullPage resourceText="access this custom report" />
  }

  return (
    <div className="flex flex-col space-y-4" style={{ maxHeight: '100%' }}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl text-foreground">{currentReport?.name || 'Reports'}</h1>
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

          {startDate && endDate && (
            <div className="hidden items-center space-x-1 lg:flex ">
              <span className="text-sm text-foreground-light">
                {dayjs(startDate).format('MMM D, YYYY')}
              </span>
              <span className="text-foreground-lighter">
                <ArrowRight size={12} />
              </span>
              <span className="text-sm text-foreground-light">
                {dayjs(endDate).format('MMM D, YYYY')}
              </span>
            </div>
          )}
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

      {config?.layout !== undefined && config.layout.length <= 0 ? (
        <div className="flex min-h-full items-center justify-center rounded border-2 border-dashed p-16 border-default">
          {canUpdateReport ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="default" iconRight={<Plus size={14} />}>
                  <span>
                    {config.layout.length <= 0 ? 'Add your first chart' : 'Add another chart'}
                  </span>
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
              onRemoveChart={popChart}
              onUpdateChart={updateChart}
              setEditableReport={setConfig}
            />
          )}
        </div>
      )}
    </div>
  )
}

export default Reports
