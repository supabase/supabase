import {
  ScaffoldSection,
  ScaffoldSectionTitle,
  ScaffoldSectionContent,
} from 'components/layouts/Scaffold'
import { Card, CardContent, cn } from 'ui'
import Link from 'next/link'
import { useParams } from 'common'
import { ChevronRight, Loader2 } from 'lucide-react'
import { Reports } from 'icons'
import {
  getChangeSign,
  getChangeColor,
  fetchAllAuthMetrics,
  processAllAuthMetrics,
  calculatePercentageChange,
} from './OverviewUsage.constants'
import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { ReportChartV2 } from 'components/interfaces/Reports/v2/ReportChartV2'
import { createAuthReportConfig } from 'data/reports/v2/auth.config'
import dayjs from 'dayjs'

const StatCard = ({
  title,
  current,
  previous,
  loading,
  suffix = '',
}: {
  title: string
  current: number
  previous: number
  loading: boolean
  suffix?: string
}) => {
  const changeColor = getChangeColor(previous)
  const changeSign = getChangeSign(previous)
  const formattedCurrent = suffix === 'ms' ? current.toFixed(2) : current

  return (
    <Card>
      <CardContent
        className={cn(
          'flex flex-col my-1 gap-1',
          loading && 'opacity-50 items-center justify-center min-h-[108px]'
        )}
      >
        {loading ? (
          <Loader2 className="size-5 animate-spin text-foreground-light" />
        ) : (
          <>
            <h4 className="text-sm text-foreground-lighter font-normal mb-0 truncate">{title}</h4>
            <p className="text-xl">{`${formattedCurrent}${suffix}`}</p>
            <p className={cn('text-sm text-foreground-lighter', changeColor)}>
              {`${changeSign}${previous.toFixed(1)}%`}
            </p>
          </>
        )}
      </CardContent>
    </Card>
  )
}

export const OverviewUsage = () => {
  const { ref } = useParams()

  const { data: currentData, isLoading: currentLoading } = useQuery({
    queryKey: ['auth-metrics', ref, 'current'],
    queryFn: () => fetchAllAuthMetrics(ref as string, 'current'),
    enabled: !!ref,
  })

  const { data: previousData, isLoading: previousLoading } = useQuery({
    queryKey: ['auth-metrics', ref, 'previous'],
    queryFn: () => fetchAllAuthMetrics(ref as string, 'previous'),
    enabled: !!ref,
  })

  const metrics = processAllAuthMetrics(currentData?.result || [], previousData?.result || [])
  const isLoading = currentLoading || previousLoading

  const activeUsersChange = calculatePercentageChange(
    metrics.current.activeUsers,
    metrics.previous.activeUsers
  )
  const passwordResetChange = calculatePercentageChange(
    metrics.current.passwordResets,
    metrics.previous.passwordResets
  )
  const signInLatencyChange = calculatePercentageChange(
    metrics.current.signInLatency,
    metrics.previous.signInLatency
  )
  const signUpLatencyChange = calculatePercentageChange(
    metrics.current.signUpLatency,
    metrics.previous.signUpLatency
  )

  const endDate = dayjs().toISOString()
  const startDate = dayjs().subtract(24, 'hour').toISOString()

  const signUpChartConfig = useMemo(() => {
    const config = createAuthReportConfig({
      projectRef: ref as string,
      startDate,
      endDate,
      interval: '1h',
      filters: { status_code: null },
    })
    const chart = config.find((c) => c.id === 'signups')
    if (chart) {
      return { ...chart, defaultChartStyle: 'bar' }
    }
    return chart
  }, [ref, startDate, endDate])

  const signInChartConfig = useMemo(() => {
    const config = createAuthReportConfig({
      projectRef: ref as string,
      startDate,
      endDate,
      interval: '1h',
      filters: { status_code: null },
    })
    const chart = config.find((c) => c.id === 'sign-in-attempts')
    if (chart) {
      return { ...chart, defaultChartStyle: 'bar' }
    }
    return chart
  }, [ref, startDate, endDate])

  const updateDateRange = (from: string, to: string) => {
    console.log('Date range update:', from, to)
  }

  return (
    <ScaffoldSection isFullWidth>
      <div className="flex items-center justify-between mb-4">
        <ScaffoldSectionTitle>Usage</ScaffoldSectionTitle>
        <Link
          href={`/project/${ref}/reports/auth?its=${startDate}&ite=${endDate}&isHelper=true&helperText=Last+24+hours`}
          className="text-sm text-link inline-flex items-center gap-x-1.5"
        >
          <Reports size={14} />
          <span>View all reports</span>
          <ChevronRight size={14} />
        </Link>
      </div>
      <ScaffoldSectionContent className="gap-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard
            title="Active Users"
            current={metrics.current.activeUsers}
            previous={activeUsersChange}
            loading={isLoading}
          />
          <StatCard
            title="Password Reset Requests"
            current={metrics.current.passwordResets}
            previous={passwordResetChange}
            loading={isLoading}
          />
          <StatCard
            title="Sign up Latency"
            current={Number(metrics.current.signUpLatency.toFixed(2))}
            previous={signUpLatencyChange}
            loading={isLoading}
            suffix="ms"
          />
          <StatCard
            title="Sign in Latency"
            current={Number(metrics.current.signInLatency.toFixed(2))}
            previous={signInLatencyChange}
            loading={isLoading}
            suffix="ms"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {signUpChartConfig && (
            <ReportChartV2
              report={signUpChartConfig}
              projectRef={ref as string}
              startDate={startDate}
              endDate={endDate}
              interval="1h"
              updateDateRange={updateDateRange}
            />
          )}
          {signInChartConfig && (
            <ReportChartV2
              report={signInChartConfig}
              projectRef={ref as string}
              startDate={startDate}
              endDate={endDate}
              interval="1h"
              updateDateRange={updateDateRange}
            />
          )}
        </div>
      </ScaffoldSectionContent>
    </ScaffoldSection>
  )
}
