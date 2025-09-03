import { useQueryClient } from '@tanstack/react-query'
import { useParams } from 'common'
import dayjs from 'dayjs'
import { ArrowRight, ChevronDown, RefreshCw } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { Label } from '@ui/components/shadcn/ui/label'
import { ReportChartV2 } from 'components/interfaces/Reports/v2/ReportChartV2'
import ReportHeader from 'components/interfaces/Reports/ReportHeader'
import ReportPadding from 'components/interfaces/Reports/ReportPadding'
import ReportStickyNav from 'components/interfaces/Reports/ReportStickyNav'
import { LogsDatePicker } from 'components/interfaces/Settings/Logs/Logs.DatePickers'
import DefaultLayout from 'components/layouts/DefaultLayout'
import ReportsLayout from 'components/layouts/ReportsLayout/ReportsLayout'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { Button, Checkbox, DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from 'ui'
import { useChartHoverState } from 'components/ui/Charts/useChartHoverState'

import { useEdgeFunctionsQuery } from 'data/edge-functions/edge-functions-query'
import { edgeFunctionReports } from 'data/reports/v2/edge-functions.config'

import { REPORT_DATERANGE_HELPER_LABELS } from 'components/interfaces/Reports/Reports.constants'
import UpgradePrompt from 'components/interfaces/Settings/Logs/UpgradePrompt'
import { useReportDateRange } from 'hooks/misc/useReportDateRange'

import type { NextPageWithLayout } from 'types'
import { ReportSettings } from 'components/ui/Charts/ReportSettings'

const EdgeFunctionsReportV2: NextPageWithLayout = () => {
  return (
    <ReportPadding>
      <EdgeFunctionsUsage />
    </ReportPadding>
  )
}

EdgeFunctionsReportV2.getLayout = (page) => (
  <DefaultLayout>
    <ReportsLayout title="Edge Functions">{page}</ReportsLayout>
  </DefaultLayout>
)

export default EdgeFunctionsReportV2

const EdgeFunctionsUsage = () => {
  const { ref } = useParams()
  const { data: functions, isLoading: isLoadingFunctions } = useEdgeFunctionsQuery({
    projectRef: ref,
  })

  const chartSyncId = `edge-functions-${ref}`
  useChartHoverState(chartSyncId)

  const [isOpen, setIsOpen] = useState(false)
  const [functionIds, setFunctionIds] = useState<string[]>([])
  const [tempFunctionIds, setTempFunctionIds] = useState<string[]>(functionIds)

  useEffect(() => {
    if (isOpen) {
      setTempFunctionIds(functionIds)
    }
  }, [isOpen, functionIds])

  const {
    selectedDateRange,
    updateDateRange,
    datePickerValue,
    datePickerHelpers,
    showUpgradePrompt,
    setShowUpgradePrompt,
    handleDatePickerChange,
  } = useReportDateRange(REPORT_DATERANGE_HELPER_LABELS.LAST_60_MINUTES)

  const queryClient = useQueryClient()
  const [isRefreshing, setIsRefreshing] = useState(false)

  const reportConfig = useMemo(() => {
    return edgeFunctionReports({
      projectRef: ref!,
      functions: functions ?? [],
      startDate: selectedDateRange?.period_start?.date ?? '',
      endDate: selectedDateRange?.period_end?.date ?? '',
      interval: selectedDateRange?.interval ?? 'minute',
      filters: {
        functionIds,
      },
    })
  }, [ref, functions, selectedDateRange, functionIds])

  const onRefreshReport = async () => {
    if (!selectedDateRange) return

    setIsRefreshing(true)
    queryClient.invalidateQueries(['report-v2'])
    setTimeout(() => setIsRefreshing(false), 1000)
  }

  return (
    <>
      <ReportHeader title="Edge Functions" showDatabaseSelector={false} />
      <ReportStickyNav
        content={
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <ButtonTooltip
                type="default"
                disabled={isRefreshing}
                icon={<RefreshCw className={isRefreshing ? 'animate-spin' : ''} />}
                className="w-7"
                tooltip={{ content: { side: 'bottom', text: 'Refresh report' } }}
                onClick={onRefreshReport}
              />
              <ReportSettings chartId="edge-functions-charts" />

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
                source="edgeFunctionsReportDateRange"
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
            <div>
              <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
                <DropdownMenuTrigger asChild>
                  <Button type="default" iconRight={<ChevronDown />}>
                    {functionIds.length === 0
                      ? 'All Functions'
                      : `${functionIds.length} function${
                          functionIds.length > 1 ? 's' : ''
                        } selected`}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="bottom" align="start" className="w-72 p-0">
                  <div className="space-y-px max-h-60 overflow-y-auto p-1">
                    <Label
                      key="all-functions"
                      htmlFor="all-functions"
                      className="flex items-center hover:bg-overlay-hover overflow-hidden p-2 rounded-sm"
                    >
                      <Checkbox
                        id="all-functions"
                        checked={tempFunctionIds.length === 0}
                        onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                          if (event.target.checked) {
                            setTempFunctionIds([])
                          }
                        }}
                      />
                      <div className="flex flex-col">
                        <span>All Functions</span>
                      </div>
                    </Label>
                    {functions
                      ?.filter((fn: { slug: string }) => typeof fn.slug === 'string')
                      .map((fn) => (
                        <Label
                          key={fn.id}
                          htmlFor={fn.id}
                          className="flex items-center hover:bg-overlay-hover overflow-hidden p-2 rounded-sm"
                        >
                          <div>
                            <Checkbox
                              id={fn.id}
                              checked={tempFunctionIds.includes(fn.id)}
                              onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                                if (event.target.checked) {
                                  setTempFunctionIds([...tempFunctionIds, fn.id])
                                } else {
                                  setTempFunctionIds(tempFunctionIds.filter((id) => id !== fn.id))
                                }
                              }}
                            />
                          </div>
                          <div className="flex flex-col">
                            <span>{fn.slug}</span>
                          </div>
                        </Label>
                      ))}
                  </div>
                  <div className="flex items-center justify-end gap-2 border-t border-default p-2">
                    <Button
                      size="tiny"
                      type="default"
                      onClick={() => setIsOpen(false)}
                      htmlType="button"
                    >
                      Cancel
                    </Button>
                    <Button
                      size="tiny"
                      type="primary"
                      htmlType="button"
                      onClick={() => {
                        setFunctionIds(tempFunctionIds)
                        setIsOpen(false)
                      }}
                    >
                      Apply
                    </Button>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        }
      >
        <div className="mt-8 flex flex-col gap-4">
          {selectedDateRange &&
            reportConfig
              .filter((report) => !report.hide)
              .map((report) => (
                <ReportChartV2
                  key={`${report.id}`}
                  report={report}
                  projectRef={ref!}
                  interval={selectedDateRange.interval}
                  startDate={selectedDateRange?.period_start?.date}
                  endDate={selectedDateRange?.period_end?.date}
                  updateDateRange={updateDateRange}
                  functionIds={functionIds}
                  syncId={chartSyncId}
                />
              ))}
        </div>
      </ReportStickyNav>
    </>
  )
}
