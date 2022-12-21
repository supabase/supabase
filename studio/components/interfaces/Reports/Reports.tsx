import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import * as Tooltip from '@radix-ui/react-tooltip'
import { groupBy, isNull } from 'lodash'
import { toJS } from 'mobx'
import dayjs from 'dayjs'
import {
  Badge,
  Button,
  Dropdown,
  IconArrowRight,
  IconChevronRight,
  IconHome,
  IconPlus,
  IconSave,
  IconSettings,
} from 'ui'
import { PermissionAction } from '@supabase/shared-types/out/constants'

import { checkPermissions, useStore } from 'hooks'
import { uuidv4 } from 'lib/helpers'
import { METRIC_CATEGORIES, METRICS, TIME_PERIODS_REPORTS } from 'lib/constants'
import { useProjectContentStore } from 'stores/projectContentStore'
import Loading from 'components/ui/Loading'
import DateRangePicker from 'components/to-be-cleaned/DateRangePicker'
import NoPermission from 'components/ui/NoPermission'
import GridResize from './GridResize'
import { LAYOUT_COLUMN_COUNT } from './Reports.constants'

const DEFAULT_CHART_COLUMN_COUNT = 12
const DEFAULT_CHART_ROW_COUNT = 4

const Reports = () => {
  const { ui } = useStore()

  const router = useRouter()
  const { id, ref } = router.query

  const [report, setReport] = useState<any>()

  const [loading, setLoading] = useState<any>(false)
  const [config, setConfig] = useState<any>(null)
  const [originalConfig, setOriginalConfig] = useState<any>(null)
  const [hasEdits, setHasEdits] = useState<any>(false)
  const [saving, setSaving] = useState<any>(false)
  const [startDate, setStartDate] = useState<any>(null)
  const [endDate, setEndDate] = useState<any>(null)

  const contentStore = useProjectContentStore(ref)
  const canReadReport = checkPermissions(PermissionAction.READ, 'user_content', {
    resource: {
      type: 'report',
      visibility: report?.visibility,
      owner_id: report?.owner_id,
    },
    subject: { id: ui.profile?.id },
  })
  const canUpdateReport = checkPermissions(PermissionAction.UPDATE, 'user_content', {
    resource: {
      type: 'report',
      visibility: report?.visibility,
      owner_id: report?.owner_id,
    },
    subject: { id: ui.profile?.id },
  })

  /*
   * fetchReport()
   *
   * Fetches the report and sets the main states of the page
   * Also sets an 'original' report for comaprison.
   *
   * toJS() is used to deepcopy mobx to js
   */
  const fetchReport = async () => {
    setLoading(true)
    await contentStore.load()
    const reportData = contentStore.byId(id)

    if (reportData) {
      setReport(reportData)

      // [Joshen TODO] Worth refactoring - no need for so many states
      setConfig(toJS(reportData.content))
      setOriginalConfig(toJS(reportData.content))
    }

    setLoading(false)
    return reportData
  }

  /*
   * handleDateRangePicker()
   *
   * Sets date range of reports, using the DateRangePicker component
   */
  function handleDateRangePicker({ period_start, period_end }: any) {
    setStartDate(period_start.date)
    setEndDate(period_end.date)
  }

  /*
   * checkEditState()
   *
   * Makes a comparison of report changes vs the original report
   *
   * returns setHasEdits(bool)
   */
  function checkEditState() {
    /*
     * Shallow copying the config state variable maintains a mobx reference
     * Instead, we stringify it and parse it again to remove anything
     * that can be mutated at component state level.
     *
     * This allows us to mutate these configs, like removing dates in case we do not
     * want to compare fixed dates as possible differences from saved and edited versions of report.
     */
    let _config = JSON.parse(JSON.stringify(config))
    let _original = JSON.parse(JSON.stringify(originalConfig))

    if (!_original || !_config) return

    /*
     * Check if the dates are a fixed custom date range
     * if they are not, we remove the dates for the edit check comparison
     *
     * this feature is not yet in use, but if we did use custom fixed date ranges,
     * the below would not need to be run
     */
    if (
      _config.period_start.time_period != 'custom' ||
      _config.period_end.time_period != 'custom'
    ) {
      _original.period_start.date = ''
      _config.period_start.date = ''
      _original.period_end.date = ''
      _config.period_end.date = ''
    }

    // Runs comparison
    if (JSON.stringify(_config) == JSON.stringify(_original)) {
      setHasEdits(false)
    } else {
      setHasEdits(true)
    }
  }

  // Reloads the entire report when id changes
  useEffect(() => {
    fetchReport()
  }, [id])

  // Runs when any changes are made to report
  useEffect(() => {
    checkEditState()
  }, [config])

  if (!config) {
    return <Loading />
  }

  if (!canReadReport) {
    return <NoPermission isFullPage resourceText="access this project's report" />
  }

  // Updates the report and reloads the report again
  const saveReport = async () => {
    setSaving(true)
    const payload = {
      content: config,
    }
    await contentStore.update(id, payload, 'report')
    await fetchReport()
    setHasEdits(false)
    setSaving(false)
  }

  /*
   * handleChartSelection()
   *
   * Handler for the chart behaviour
   */
  function handleChartSelection({ metric, value }: any) {
    if (value) {
      pushChart({ metric })
    } else {
      popChart({ metric })
    }
  }

  /*
   * pushChart()
   *
   * Adds a new chart to the report
   */
  function pushChart({ metric }: any) {
    let current = config.layout
    const index = current.length + 1

    let x = 0
    let y = null

    const chartsByY = groupBy(config.layout, 'y')
    const yValues = Object.keys(chartsByY)

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
      id: uuidv4(),
      attribute: metric.key,
      label: metric.label,
      provider: metric.provider,
    })

    setConfig({
      ...config,
      layout: [...current],
    })
  }

  /*
   * popChart()
   *
   * Removes a chart from the report based on its attribute
   */
  function popChart({ metric }: any) {
    const { key } = metric
    let current = config.layout

    const foundIndex = current.findIndex((x: any, i: number) => {
      if (x.attribute === key) {
        return x
      }
    })
    current.splice(foundIndex, 1)
    setConfig({
      ...config,
      layout: [...current],
    })
  }

  const MetricOptions = () => {
    return (
      <>
        {Object.values(METRIC_CATEGORIES).map((cat) => {
          return (
            <>
              <Dropdown
                isNested
                overlay={
                  <>
                    {METRICS.filter((metric) => metric?.category?.key === cat.key).map((metric) => {
                      return (
                        <Dropdown.Checkbox
                          key={metric.key}
                          checked={config.layout?.find((x: any) => x.attribute === metric.key)}
                          onChange={(e) => handleChartSelection({ metric, value: e })}
                        >
                          <div className="flex flex-col space-y-0">
                            <span>{metric.label}</span>
                          </div>
                        </Dropdown.Checkbox>
                      )
                    })}
                  </>
                }
              >
                <Dropdown.TriggerItem icon={cat.icon ? cat.icon : <IconHome size="tiny" />}>
                  {cat.label}
                  <Dropdown.RightSlot>
                    <IconChevronRight size={14} />
                  </Dropdown.RightSlot>
                </Dropdown.TriggerItem>
              </Dropdown>
            </>
          )
        })}
      </>
    )
  }

  return (
    <div className="mx-6 flex flex-col space-y-4" style={{ maxHeight: '100%' }}>
      <h1 className="text-xl text-scale-1200">Reports</h1>

      <div className="mb-4 flex items-center justify-between space-x-3">
        <div className="flex items-center space-x-3">
          <DateRangePicker
            onChange={handleDateRangePicker}
            value="7d"
            options={TIME_PERIODS_REPORTS}
            loading={loading}
          />

          {startDate && endDate && (
            <div className="hidden items-center space-x-1 lg:flex ">
              <span className="text-sm text-scale-1100">
                {dayjs(startDate).format('MMM D, YYYY')}
              </span>
              <span className="text-scale-900">
                <IconArrowRight size={12} />
              </span>
              <span className="text-sm text-scale-1100">
                {dayjs(endDate).format('MMM D, YYYY')}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {hasEdits && (
            <div className="hidden xl:inline-block">
              <Badge color="green">There are unsaved changes</Badge>
            </div>
          )}
          {hasEdits && (
            <Button
              type={!hasEdits ? 'default' : 'primary'}
              disabled={!hasEdits}
              icon={<IconSave />}
              onClick={() => saveReport()}
              loading={saving}
            >
              {hasEdits && 'Save changes'}
            </Button>
          )}

          {canUpdateReport ? (
            <Dropdown side="bottom" align="end" overlay={<MetricOptions />}>
              <Button as="span" type="default" iconRight={<IconSettings />}>
                Add / Remove charts
              </Button>
            </Dropdown>
          ) : (
            <Tooltip.Root delayDuration={0}>
              <Tooltip.Trigger>
                <Button disabled as="span" type="default" iconRight={<IconSettings />}>
                  Add / Remove charts
                </Button>
              </Tooltip.Trigger>
              <Tooltip.Content side="bottom">
                <Tooltip.Arrow className="radix-tooltip-arrow" />
                <div
                  className={[
                    'rounded bg-scale-100 py-1 px-2 leading-none shadow',
                    'border border-scale-200',
                  ].join(' ')}
                >
                  <span className="text-xs text-scale-1200">
                    You need additional permissions to update this project's report
                  </span>
                </div>
              </Tooltip.Content>
            </Tooltip.Root>
          )}
        </div>
      </div>

      {config.layout.length <= 0 ? (
        <div className="flex min-h-full items-center justify-center rounded border-2 border-dashed p-16 dark:border-dark">
          {canUpdateReport ? (
            <Dropdown side="bottom" align="center" overlay={<MetricOptions />}>
              <Button as="span" type="default" iconRight={<IconPlus />}>
                {config.layout.length <= 0 ? 'Add your first chart' : 'Add another chart'}
              </Button>
            </Dropdown>
          ) : (
            <p className="text-sm text-scale-1000">No charts set up yet in report</p>
          )}
        </div>
      ) : (
        <div className="relative mb-16 max-w-7xl flex-grow">
          {config && startDate && endDate && (
            // @ts-ignore
            <GridResize
              startDate={startDate}
              endDate={endDate}
              interval={config.interval}
              editableReport={config}
              setEditableReport={setConfig}
            />
          )}
        </div>
      )}
    </div>
  )
}

export default Reports
