import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { ArrowRight, RefreshCw } from 'lucide-react'
import { useParams } from 'common'

import ReportHeader from 'components/interfaces/Reports/ReportHeader'
import ReportPadding from 'components/interfaces/Reports/ReportPadding'
import DefaultLayout from 'components/layouts/DefaultLayout'
import ReportsLayout from 'components/layouts/ReportsLayout/ReportsLayout'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { DateRangePicker } from 'components/ui/DateRangePicker'

import { useCurrentOrgPlan } from 'hooks/misc/useCurrentOrgPlan'
import { TIME_PERIODS_INFRA } from 'lib/constants/metrics'
import { getAuthReportAttributes } from 'data/reports/auth-charts'

import ReportChart from 'components/interfaces/Reports/ReportChart'
import type { NextPageWithLayout } from 'types'

const AuthReport: NextPageWithLayout = () => {
  return (
    <ReportPadding>
      <AuthUsage />
    </ReportPadding>
  )
}

AuthReport.getLayout = (page) => (
  <DefaultLayout>
    <ReportsLayout title="Auth">{page}</ReportsLayout>
  </DefaultLayout>
)

export type UpdateDateRange = (from: string, to: string) => void
export default AuthReport

const AuthUsage = () => {
  const { ref } = useParams()

  const defaultStart = dayjs().subtract(1, 'day').toISOString()
  const defaultEnd = dayjs().toISOString()
  const [dateRange, setDateRange] = useState<any>({
    period_start: { date: defaultStart, time_period: '1d' },
    period_end: { date: defaultEnd, time_period: 'today' },
    interval: '1h',
  })

  const queryClient = useQueryClient()
  const [isRefreshing, setIsRefreshing] = useState(false)

  const { plan: orgPlan, isLoading: isOrgPlanLoading } = useCurrentOrgPlan()
  const isFreePlan = !isOrgPlanLoading && orgPlan?.id === 'free'

  const AUTH_REPORT_ATTRIBUTES = getAuthReportAttributes(isFreePlan)

  const onRefreshReport = async () => {
    if (!dateRange) return

    setIsRefreshing(true)
    AUTH_REPORT_ATTRIBUTES.forEach((attr) => {
      attr.attributes.forEach((subAttr) => {
        queryClient.invalidateQueries([
          'auth-metrics',
          ref,
          subAttr.attribute,
          dateRange.period_start.date,
          dateRange.period_end.date,
          dateRange.interval,
        ])
      })
    })
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

  return (
    <>
      <ReportHeader title="Auth" />
      <section className="relative pt-16 -mt-2">
        <div className="absolute inset-0 z-40 pointer-events-none flex flex-col gap-4">
          <div className="sticky top-0 py-4 mb-4 flex items-center space-x-3 pointer-events-auto dark:bg-background-200 bg-background">
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
                onChange={(values) => {
                  if (values.interval === '1d') {
                    setDateRange({ ...values, interval: '1h' })
                  } else {
                    setDateRange(values)
                  }
                }}
              />
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
            AUTH_REPORT_ATTRIBUTES.filter((attr) => !attr.hide).map((attr, i) => (
              <ReportChart
                key={`${attr.id}-${i}`}
                chart={attr}
                interval={dateRange.interval}
                startDate={dateRange?.period_start?.date}
                endDate={dateRange?.period_end?.date}
                updateDateRange={updateDateRange}
              />
            ))}
        </div>
      </section>
    </>
  )
}
