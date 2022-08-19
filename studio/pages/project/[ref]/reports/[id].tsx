import { useEffect, useState } from 'react'
import RGL, { WidthProvider } from 'react-grid-layout'
import { observer } from 'mobx-react-lite'
import { useRouter } from 'next/router'
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
} from '@supabase/ui'

import { checkPermissions } from 'hooks'
import { uuidv4 } from 'lib/helpers'
import { METRIC_CATEGORIES, METRICS, TIME_PERIODS_REPORTS } from 'lib/constants'
import { useProjectContentStore } from 'stores/projectContentStore'
import { ProjectLayoutWithAuth } from 'components/layouts'
import Loading from 'components/ui/Loading'
import EditReportModal from 'components/to-be-cleaned/Reports/EditReportModal'
import ChartHandler from 'components/to-be-cleaned/Charts/ChartHandler'
import DateRangePicker from 'components/to-be-cleaned/DateRangePicker'
import { NextPageWithLayout } from 'types'
import { PermissionAction } from '@supabase/shared-types/out/constants'

const ReactGridLayout = WidthProvider(RGL)

const LAYOUT_COLUMN_COUNT = 24
const DEFAULT_CHART_COLUMN_COUNT = 12
const DEFAULT_CHART_ROW_COUNT = 4

/*
 * PageLayout is used to setup layout - as usual it will requires inject global store
 */
const PageLayout: NextPageWithLayout = () => {
  return (
    <>
      <div className="mx-auto my-8 w-full max-w-7xl">
        <Reports />
      </div>
      <EditReportModal />
    </>
  )
}

PageLayout.getLayout = (page) => <ProjectLayoutWithAuth>{page}</ProjectLayoutWithAuth>

export default observer(PageLayout)

const Reports = () => {
  const router = useRouter()
  const { id, ref } = router.query
  const [loading, setLoading] = useState<any>(false)
  const [name, setName] = useState<any>(null)
  const [description, setDescription] = useState<any>(null)
  const [config, setConfig] = useState<any>(null)
  const [originalConfig, setOriginalConfig] = useState<any>(null)
  const [hasEdits, setHasEdits] = useState<any>(false)
  const [saving, setSaving] = useState<any>(false)
  const [startDate, setStartDate] = useState<any>(null)
  const [endDate, setEndDate] = useState<any>(null)

  // const canSaveReport = checkPermissions(PermissionAction.UPDATE, 'user_content', {
  //   resource: { type: 'report' },
  // })
  const contentStore = useProjectContentStore(ref)

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
      setName(toJS(reportData?.name))
      setDescription(toJS(reportData?.description))
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

    /*
     * Runs comparison
     */
    if (JSON.stringify(_config) == JSON.stringify(_original)) {
      setHasEdits(false)
    } else {
      setHasEdits(true)
    }
  }

  /*
   * Reloads the entire report when id changes
   */
  useEffect(() => {
    fetchReport()
  }, [id])

  /*
   * Runs when any changes are made to report
   */
  useEffect(() => {
    checkEditState()
  }, [config])

  /*
   * Loading state
   */
  if (!config) {
    return <Loading />
  }

  /*
   * saveReport()
   *
   * Updates the report and reloads the report again
   */
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

    const newConfig = {
      ...config,
      layout: current,
    }

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
                            {/* <span className="opacity-50">{metric.description}</span> */}
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
      <h1 className="text-scale-1200 text-xl">Reports</h1>

      <div className="mb-4 flex items-center justify-between space-x-3">
        <div className="flex items-center space-x-3">
          {/* @ts-ignore */}
          <DateRangePicker
            onChange={handleDateRangePicker}
            value={'7d'}
            options={TIME_PERIODS_REPORTS}
            loading={loading}
          />

          {startDate && endDate && (
            <div className="hidden items-center space-x-1 lg:flex ">
              <span className="text-scale-1100 text-sm">
                {dayjs(startDate).format('MMM D, YYYY')}
              </span>
              <span className="text-scale-900">
                <IconArrowRight size={12} />
              </span>
              <span className="text-scale-1100 text-sm">
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

          <Dropdown side="bottom" align="end" overlay={<MetricOptions />}>
            <Button as="span" type="default" iconRight={<IconSettings />}>
              Add / Remove charts
            </Button>
          </Dropdown>
          {/* <Button type="default" icon={<IconCopy />}>
              Duplicate report
            </Button> */}
        </div>
      </div>

      {config.layout.length <= 0 ? (
        <div className="dark:border-dark flex min-h-full items-center justify-center rounded border-2 border-dashed p-16">
          <Dropdown side="bottom" align="center" overlay={<MetricOptions />}>
            <Button as="span" type="default" iconRight={<IconPlus />}>
              {config.layout.length <= 0 ? 'Add your first chart' : 'Add another chart'}
            </Button>
          </Dropdown>
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

const GridResize = ({ startDate, endDate, interval, editableReport, setEditableReport }: any) => {
  if (!editableReport) return

  useEffect(() => {
    generateDOM()
  }, [editableReport])

  function generateDOM() {
    return editableReport.layout.map((x: any, i: number) => {
      //   const availableHandles = ['s', 'w', 'e', 'n', 'sw', 'nw', 'se', 'ne']
      //   x.resizeHandles = availableHandles
      return (
        <div
          key={x.id}
          data-grid={{ ...x, minH: 4, maxH: 4, minW: 8 }}
          className="react-grid-layout__report-item bg-panel-body-light dark:bg-panel-body-dark border-panel-border-light dark:border-panel-border-dark group relative rounded border px-6 py-4 shadow-sm hover:border-green-900 dark:hover:border-green-900"
        >
          <ChartHandler
            startDate={startDate}
            endDate={endDate}
            interval={interval}
            attribute={x.attribute}
            provider={x.provider}
            label={x.label}
            customDateFormat={'MMM D, YYYY'}
          />
          <div className="absolute inset-x-0 top-3 ">
            <div className="flex justify-around">
              <div className="flex h-3 w-24 cursor-move flex-col space-y-2">
                <div className="hidden h-3 w-full border-4 border-dotted border-green-900 opacity-50 transition-all hover:opacity-100 group-hover:block"></div>
              </div>
            </div>
          </div>
        </div>
      )
    })
  }

  function onLayoutChange(layout: any) {
    let updatedLayout = editableReport.layout
    layout.map((item: any) => {
      const index = updatedLayout.findIndex((x: any) => x.id === item.i)
      updatedLayout[index].w = layout[index].w
      updatedLayout[index].h = layout[index].h
      updatedLayout[index].x = layout[index].x
      updatedLayout[index].y = layout[index].y
    })
    const payload = {
      ...editableReport,
      layout: updatedLayout,
    }
    setEditableReport(payload)
  }

  return (
    <>
      <ReactGridLayout
        autoSize={true}
        layout={editableReport}
        onLayoutChange={(layout) => onLayoutChange(layout)}
        rowHeight={60}
        cols={LAYOUT_COLUMN_COUNT}
        containerPadding={[0, 0]}
        compactType="horizontal"
      >
        {generateDOM()}
      </ReactGridLayout>
    </>
  )
}
