import { PermissionAction } from '@supabase/shared-types/out/constants'
import dayjs from 'dayjs'
import { groupBy, isNull } from 'lodash'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { useParams } from 'common'
import DateRangePicker from 'components/to-be-cleaned/DateRangePicker'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import DatabaseSelector from 'components/ui/DatabaseSelector'
import { Loading } from 'components/ui/Loading'
import NoPermission from 'components/ui/NoPermission'
import { useContentQuery } from 'data/content/content-query'
import { useContentUpdateMutation } from 'data/content/content-update-mutation'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { TIME_PERIODS_REPORTS } from 'lib/constants/metrics'
import { uuidv4 } from 'lib/helpers'
import { useProfile } from 'lib/profile'
import { ArrowRight, Plus, PlusCircle, Save, Settings, ArrowUpDown } from 'lucide-react'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  Input_Shadcn_,
  Label_Shadcn_,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
  Popover_Shadcn_,
} from 'ui'
import GridResize from './GridResize'
import { MetricOptions } from './MetricOptions'
import { LAYOUT_COLUMN_COUNT } from './Reports.constants'

const DEFAULT_CHART_COLUMN_COUNT = 12
const DEFAULT_CHART_ROW_COUNT = 4

interface ParameterMetadata {
  name: string
  value: string
  defaultValue?: string
  occurrences: number
}

const Reports = () => {
  const { id, ref } = useParams()
  const { profile } = useProfile()

  const [config, setConfig] = useState<any>(undefined)
  const [startDate, setStartDate] = useState<any>(null)
  const [endDate, setEndDate] = useState<any>(null)
  const [hasEdits, setHasEdits] = useState<any>(false)
  const [parameters, setParameters] = useState<Record<string, string>>({})
  const [parameterMetadata, setParameterMetadata] = useState<ParameterMetadata[]>([])
  const [tempParameters, setTempParameters] = useState<Record<string, string>>({})

  const { data: userContents, isLoading } = useContentQuery(ref)
  const { mutate: saveReport, isLoading: isSaving } = useContentUpdateMutation({
    onSuccess: () => {
      setHasEdits(false)
      toast.success('Successfully saved report!')
    },
    onError: (error) => {
      toast.error(`Failed to update report: ${error.message}`)
    },
  })
  const currentReport = userContents?.content.find((report) => report.id === id)

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
    let _original = JSON.parse(JSON.stringify(currentReport?.content))

    if (!_original || !_config) return

    console.log('_config', _config, _original, JSON.stringify(_config) == JSON.stringify(_original))

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
  // Updates the report and reloads the report again
  const onSaveReport = async () => {
    if (ref === undefined) return console.error('Project ref is required')
    if (id === undefined) return console.error('Report ID is required')
    saveReport({ projectRef: ref, id, type: 'report', content: config })
  }

  function handleChartSelection({ metric, value }: any) {
    if (value) pushChart({ metric })
    else popChart({ metric })
  }

  function pushChart({ metric }: any) {
    const current = [...config.layout]

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
      id: metric.id || uuidv4(),
      isSnippet: !!metric.isSnippet,
      attribute: metric.key,
      label: metric.label,
      provider: metric.provider,
    })

    setConfig({
      ...config,
      layout: [...current],
    })

    // Scroll closest overflow-auto container to bottom
    setTimeout(() => {
      const element = document.querySelector('.relative.mb-16.max-w-7xl')
      const scrollableParent = element?.closest('main')
      if (scrollableParent) {
        scrollableParent.scrollTo({
          top: scrollableParent.scrollHeight,
          behavior: 'smooth',
        })
      }
    }, 100)
  }

  function popChart({ metric }: any) {
    const { key, id } = metric
    const current = [...config.layout]

    const foundIndex = current.findIndex((x: any, i: number) => {
      if (x.attribute === key || x.id === id) {
        return x
      }
    })
    current.splice(foundIndex, 1)
    setConfig({
      ...config,
      layout: [...current],
    })
  }

  useEffect(() => {
    if (currentReport !== undefined) {
      setConfig(structuredClone(currentReport?.content))
    }
  }, [currentReport])

  const handleSetConfig = (payload: any) => {
    console.log('config set!', payload, currentReport)
    setConfig(payload)
    checkEditState()
  }

  const handleParametersSubmit = () => {
    setParameters(tempParameters)
  }

  if (isLoading) {
    return <Loading />
  }

  if (!canReadReport) {
    return <NoPermission isFullPage resourceText="access this custom report" />
  }

  console.log('parameterMetadata', parameterMetadata)

  return (
    <div className="flex flex-col" style={{ maxHeight: '100%' }}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl text-foreground">{currentReport?.name || 'Reports'}</h1>
          <p className="text-foreground-light">{currentReport?.description}</p>
        </div>
        {hasEdits && (
          <div className="flex items-center gap-x-2">
            <Button
              type="default"
              onClick={() => setConfig(currentReport?.content)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              type="primary"
              icon={<Save />}
              onClick={() => onSaveReport()}
              loading={isSaving}
            >
              Save changes
            </Button>
          </div>
        )}
      </div>
      <div className="mb-4 flex items-center justify-between space-x-3 sticky top-0 py-3 bg-surface-75 z-20">
        <div className="flex items-center space-x-3">
          <DateRangePicker
            onChange={handleDateRangePicker}
            value="7d"
            options={TIME_PERIODS_REPORTS}
            loading={isLoading}
          />

          {/* {startDate && endDate && (
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
          )} */}
          {parameterMetadata.length > 0 && (
            <Popover_Shadcn_ modal={false}>
              <PopoverTrigger_Shadcn_ asChild>
                <Button type="default" icon={<ArrowUpDown size={14} />}>
                  <div className="flex items-center gap-1">
                    <span className="text-foreground-muted">Parameters</span>
                    <span>{parameterMetadata.length}</span>
                  </div>
                </Button>
              </PopoverTrigger_Shadcn_>
              <PopoverContent_Shadcn_ side="bottom" align="start" className="w-[300px] p-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    {parameterMetadata.map((param) => (
                      <div key={param.name} className="grid gap-2">
                        <Label_Shadcn_ className="flex items-center gap-2">
                          {param.name}
                          {param.occurrences > 1 && (
                            <span className="text-xs text-foreground-light">
                              (used {param.occurrences} times)
                            </span>
                          )}
                        </Label_Shadcn_>
                        <Input_Shadcn_
                          size="tiny"
                          value={
                            tempParameters[param.name] ||
                            parameters[param.name] ||
                            param.defaultValue ||
                            ''
                          }
                          onChange={(e) =>
                            setTempParameters((prev) => ({
                              ...prev,
                              [param.name]: e.target.value,
                            }))
                          }
                        />
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-end">
                    <Button type="primary" size="tiny" onClick={handleParametersSubmit}>
                      Apply changes
                    </Button>
                  </div>
                </div>
              </PopoverContent_Shadcn_>
            </Popover_Shadcn_>
          )}
        </div>

        <div className="flex items-center gap-x-2">
          {canUpdateReport ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="default" icon={<Plus size={14} />}>
                  <span>Add block</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="bottom" align="end">
                <MetricOptions
                  projectRef={ref}
                  config={config}
                  handleChartSelection={handleChartSelection}
                />
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <ButtonTooltip
              disabled
              type="default"
              iconRight={<Settings size={14} />}
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
          <DatabaseSelector condensed />
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
                <MetricOptions
                  projectRef={ref}
                  config={config}
                  handleChartSelection={handleChartSelection}
                />
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <p className="text-sm text-foreground-light">No charts set up yet in report</p>
          )}
        </div>
      ) : (
        <div className="relative mb-16 max-w-7xl flex-grow">
          {config && startDate && endDate && (
            <GridResize
              startDate={startDate}
              endDate={endDate}
              interval={config.interval}
              editableReport={config}
              disableUpdate={!canUpdateReport}
              onRemoveChart={popChart}
              setEditableReport={handleSetConfig}
              parameters={parameters}
              onSetParameter={setParameterMetadata}
            />
          )}
        </div>
      )}
    </div>
  )
}

export default Reports
