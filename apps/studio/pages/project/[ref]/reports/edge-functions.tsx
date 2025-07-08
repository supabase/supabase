import { useState, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { ArrowRight, ChevronDown, RefreshCw } from 'lucide-react'
import { useParams } from 'common'

import ReportHeader from 'components/interfaces/Reports/ReportHeader'
import ReportPadding from 'components/interfaces/Reports/ReportPadding'
import DefaultLayout from 'components/layouts/DefaultLayout'
import ReportsLayout from 'components/layouts/ReportsLayout/ReportsLayout'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import ShimmerLine from 'components/ui/ShimmerLine'
import { DateRangePicker } from 'components/ui/DateRangePicker'

import { useCurrentOrgPlan } from 'hooks/misc/useCurrentOrgPlan'
import { TIME_PERIODS_INFRA } from 'lib/constants/metrics'

import type { NextPageWithLayout } from 'types'

import { Button, Checkbox, DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from 'ui'
import ReportChart from 'components/interfaces/Reports/ReportChart'
import { getEdgeFunctionReportAttributes } from 'data/reports/edgefn-charts'
import { useEdgeFunctionsQuery } from 'data/edge-functions/edge-functions-query'
import { Label } from '@ui/components/shadcn/ui/label'

const EdgeFunctionsReport: NextPageWithLayout = () => {
  return (
    <ReportPadding>
      <EdgeFunctionsUsage />
    </ReportPadding>
  )
}

EdgeFunctionsReport.getLayout = (page) => (
  <DefaultLayout>
    <ReportsLayout title="Edge Functions">{page}</ReportsLayout>
  </DefaultLayout>
)

export type UpdateDateRange = (from: string, to: string) => void
export default EdgeFunctionsReport

const EdgeFunctionsUsage = () => {
  const { ref } = useParams()
  const { data: functions, isLoading: isLoadingFunctions } = useEdgeFunctionsQuery({
    projectRef: ref,
  })
  const [isOpen, setIsOpen] = useState(false)
  const [functionIds, setFunctionIds] = useState<string[]>([])
  const [tempFunctionIds, setTempFunctionIds] = useState<string[]>(functionIds)

  useEffect(() => {
    if (isOpen) {
      setTempFunctionIds(functionIds)
    }
  }, [isOpen, functionIds])

  const defaultStart = dayjs().subtract(1, 'day').toISOString()
  const defaultEnd = dayjs().toISOString()
  const [dateRange, setDateRange] = useState<any>({
    period_start: { date: defaultStart, time_period: '1d' },
    period_end: { date: defaultEnd, time_period: 'today' },
    interval: '1h',
  })

  const queryClient = useQueryClient()
  const [isRefreshing, setIsRefreshing] = useState(false)

  useCurrentOrgPlan()

  const EDGEFN_CHARTS = getEdgeFunctionReportAttributes()

  const onRefreshReport = async () => {
    if (!dateRange) return

    setIsRefreshing(true)
    queryClient.invalidateQueries(['edge-function-report', ref])
    setTimeout(() => setIsRefreshing(false), 1000)
  }

  const handleIntervalGranularity = (from: string, to: string) => {
    const conditions = {
      '1m': dayjs(to).diff(from, 'hour') < 3, // less than 3 hours
      '10m': dayjs(to).diff(from, 'hour') < 6, // less than 6 hours
      '30m': dayjs(to).diff(from, 'hour') < 18, // less than 18 hours
      '1h': dayjs(to).diff(from, 'day') < 10, // less than 10 days
      '1d': dayjs(to).diff(from, 'day') >= 10, // more than 10 days
    }

    switch (true) {
      case conditions['1m']:
        return '1m'
      case conditions['10m']:
        return '10m'
      case conditions['30m']:
        return '30m'
      default:
        return '1h'
    }
  }

  const updateDateRange: UpdateDateRange = (from: string, to: string) => {
    setDateRange({
      period_start: { date: from, time_period: '1d' },
      period_end: { date: to, time_period: 'today' },
      interval: handleIntervalGranularity(from, to),
    })
  }

  if (!ref) {
    // Prevent rendering charts until the ref is available
    return <></>
  }

  return (
    <>
      <ReportHeader title="Edge Functions" showDatabaseSelector={false} />
      <div className="w-full flex flex-col gap-1">
        <div className="h-2 w-full">
          <ShimmerLine active={isRefreshing || isLoadingFunctions} />
        </div>
      </div>
      <section className="relative pt-16 -mt-2">
        <div className="absolute inset-0 z-40 pointer-events-none flex flex-col gap-4">
          <div className="sticky top-0 bg-200 py-4 mb-4 flex items-center space-x-3 pointer-events-auto">
            <ButtonTooltip
              type="default"
              disabled={isRefreshing}
              icon={<RefreshCw className={isRefreshing ? 'animate-spin' : ''} />}
              className="w-7"
              tooltip={{ content: { side: 'bottom', text: 'Refresh report' } }}
              onClick={onRefreshReport}
            />
            <div className="flex items-center gap-3">
              <DateRangePicker
                loading={false}
                value={'1d'}
                options={TIME_PERIODS_INFRA}
                currentBillingPeriodStart={undefined}
                onChange={(values: any) => {
                  if (values.interval === '1d') {
                    setDateRange({ ...values, interval: '1h' })
                  } else {
                    setDateRange(values)
                  }
                }}
              />
              <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
                <DropdownMenuTrigger asChild>
                  <Button type="default" iconRight={<ChevronDown />}>
                    <span>
                      {functionIds.length === 0
                        ? 'All Functions'
                        : `${functionIds.length} function${
                            functionIds.length > 1 ? 's' : ''
                          } selected`}
                    </span>
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
              {dateRange && (
                <div className="flex items-center gap-x-2 text-xs">
                  <p className="text-foreground-light">
                    {dayjs(dateRange.period_start.date).format('MMM D, h:mma')}
                  </p>
                  <p className="text-foreground-light">
                    <ArrowRight size={12} />
                  </p>
                  <p className="text-foreground-light">
                    {dayjs(dateRange.period_end.date).format('MMM D, h:mma')}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {dateRange &&
            EDGEFN_CHARTS.filter((attr) => !attr.hide).map((attr, i) => (
              <ReportChart
                key={`${attr.id}-${i}`}
                chart={attr}
                interval={dateRange.interval}
                startDate={dateRange?.period_start?.date}
                endDate={dateRange?.period_end?.date}
                updateDateRange={updateDateRange}
                functionIds={functionIds}
              />
            ))}
        </div>
      </section>
    </>
  )
}
