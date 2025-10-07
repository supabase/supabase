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
  fetchAuthData,
  calculatePercentageChange,
  sumTimeSeriesData,
  averageTimeSeriesData,
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
            <h4 className="text-sm text-foreground-lighter font-normal mb-0">{title}</h4>
            <p className="text-xl">{`${formattedCurrent}${suffix}`}</p>
            <p className={cn('text-sm text-foregroudn-lighter', changeColor)}>
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

  // Use the analytics endpoint for auth data
  const { data: activeUsersCurrent, isLoading: activeUsersCurrentLoading } = useQuery({
    queryKey: ['auth-data', ref, 'activeUsersCurrent'],
    queryFn: () => fetchAuthData(ref as string, 'activeUsersCurrent'),
    enabled: !!ref,
  })

  const { data: activeUsersPrevious, isLoading: activeUsersPreviousLoading } = useQuery({
    queryKey: ['auth-data', ref, 'activeUsersPrevious'],
    queryFn: () => fetchAuthData(ref as string, 'activeUsersPrevious'),
    enabled: !!ref,
  })

  const { data: passwordResetCurrent, isLoading: passwordResetCurrentLoading } = useQuery({
    queryKey: ['auth-data', ref, 'passwordResetCurrent'],
    queryFn: () => fetchAuthData(ref as string, 'passwordResetCurrent'),
    enabled: !!ref,
  })

  const { data: passwordResetPrevious, isLoading: passwordResetPreviousLoading } = useQuery({
    queryKey: ['auth-data', ref, 'passwordResetPrevious'],
    queryFn: () => fetchAuthData(ref as string, 'passwordResetPrevious'),
    enabled: !!ref,
  })

  const { data: signInLatencyCurrent, isLoading: signInLatencyCurrentLoading } = useQuery({
    queryKey: ['auth-data', ref, 'signInLatencyCurrent'],
    queryFn: () => fetchAuthData(ref as string, 'signInLatencyCurrent'),
    enabled: !!ref,
  })

  const { data: signInLatencyPrevious, isLoading: signInLatencyPreviousLoading } = useQuery({
    queryKey: ['auth-data', ref, 'signInLatencyPrevious'],
    queryFn: () => fetchAuthData(ref as string, 'signInLatencyPrevious'),
    enabled: !!ref,
  })

  const { data: signUpLatencyCurrent, isLoading: signUpLatencyCurrentLoading } = useQuery({
    queryKey: ['auth-data', ref, 'signUpLatencyCurrent'],
    queryFn: () => fetchAuthData(ref as string, 'signUpLatencyCurrent'),
    enabled: !!ref,
  })

  const { data: signUpLatencyPrevious, isLoading: signUpLatencyPreviousLoading } = useQuery({
    queryKey: ['auth-data', ref, 'signUpLatencyPrevious'],
    queryFn: () => fetchAuthData(ref as string, 'signUpLatencyPrevious'),
    enabled: !!ref,
  })

  const { data: recentSignUps, isLoading: recentSignUpsLoading } = useQuery({
    queryKey: ['auth-data', ref, 'recentSignUps'],
    queryFn: () => fetchAuthData(ref as string, 'recentSignUps'),
    enabled: !!ref,
  })

  // Extract data from time-series response and sum/average as needed
  const currentUserCount = sumTimeSeriesData(activeUsersCurrent?.result || [], 'count')
  const previousUserCount = sumTimeSeriesData(activeUsersPrevious?.result || [], 'count')
  const currentPasswordResets = sumTimeSeriesData(passwordResetCurrent?.result || [], 'count')
  const previousPasswordResets = sumTimeSeriesData(passwordResetPrevious?.result || [], 'count')
  const currentSignInLatency = averageTimeSeriesData(
    signInLatencyCurrent?.result || [],
    'avg_latency_ms'
  )
  const previousSignInLatency = averageTimeSeriesData(
    signInLatencyPrevious?.result || [],
    'avg_latency_ms'
  )
  const currentSignUpLatency = averageTimeSeriesData(
    signUpLatencyCurrent?.result || [],
    'avg_latency_ms'
  )
  const previousSignUpLatency = averageTimeSeriesData(
    signUpLatencyPrevious?.result || [],
    'avg_latency_ms'
  )

  const activeUsersChange = calculatePercentageChange(currentUserCount, previousUserCount)
  const passwordResetChange = calculatePercentageChange(
    currentPasswordResets,
    previousPasswordResets
  )
  const signInLatencyChange = calculatePercentageChange(currentSignInLatency, previousSignInLatency)
  const signUpLatencyChange = calculatePercentageChange(currentSignUpLatency, previousSignUpLatency)

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
      <ScaffoldSectionContent className="gap-3">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard
            title="Active Users"
            current={currentUserCount}
            previous={activeUsersChange}
            loading={activeUsersCurrentLoading}
          />
          <StatCard
            title="Password Reset Requests"
            current={currentPasswordResets}
            previous={passwordResetChange}
            loading={passwordResetCurrentLoading}
          />
          <StatCard
            title="Sign up Latency"
            current={Number(currentSignUpLatency.toFixed(2))}
            previous={signUpLatencyChange}
            loading={signUpLatencyCurrentLoading}
            suffix="ms"
          />
          <StatCard
            title="Sign in Latency"
            current={Number(currentSignInLatency.toFixed(2))}
            previous={signInLatencyChange}
            loading={signInLatencyCurrentLoading}
            suffix="ms"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
