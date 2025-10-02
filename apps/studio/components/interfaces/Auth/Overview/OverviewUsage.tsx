import {
  ScaffoldSection,
  ScaffoldSectionTitle,
  ScaffoldSectionContent,
} from 'components/layouts/Scaffold'
import { Card, CardContent, Skeleton, cn } from 'ui'
import Link from 'next/link'
import { useParams } from 'common'
import { ChevronRight, Loader2 } from 'lucide-react'
import { Reports } from 'icons'
import { getChangeSign, getChangeColor, executeAuthQueries } from './OverviewUsage.constants'
import useDbQuery from 'hooks/analytics/useDbQuery'
import { useMemo } from 'react'
import { ReportChartV2 } from 'components/interfaces/Reports/v2/ReportChartV2'
import { createAuthReportConfig } from 'data/reports/v2/auth.config'
import dayjs from 'dayjs'

const StatCard = ({
  title,
  current,
  previous,
  loading,
  suffix,
}: {
  title: string
  current: number
  previous: number
  loading: boolean
  suffix?: string
}) => {
  const changeColor = getChangeColor(previous)
  const changeSign = getChangeSign(previous)
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
            <p className="text-xl">{`${current}${suffix}`}</p>
            <p className={cn('text-sm text-foregroudn-lighter', changeColor)}>
              {`${changeSign}${previous}${suffix}`}
            </p>
          </>
        )}
      </CardContent>
    </Card>
  )
}

export const OverviewUsage = () => {
  const { ref } = useParams()
  const queries = useMemo(() => executeAuthQueries(ref as string), [ref])

  const { data: activeUsersCurrent, isLoading: activeUsersCurrentLoading } = useDbQuery({
    sql: queries.find((q) => q.key === 'activeUsersCurrent')?.sql || '',
  })

  const { data: activeUsersPrevious, isLoading: activeUsersPreviousLoading } = useDbQuery({
    sql: queries.find((q) => q.key === 'activeUsersPrevious')?.sql || '',
  })

  const { data: passwordResetCurrent, isLoading: passwordResetCurrentLoading } = useDbQuery({
    sql: queries.find((q) => q.key === 'passwordResetCurrent')?.sql || '',
  })

  const { data: passwordResetPrevious, isLoading: passwordResetPreviousLoading } = useDbQuery({
    sql: queries.find((q) => q.key === 'passwordResetPrevious')?.sql || '',
  })

  const { data: signInLatencyCurrent, isLoading: signInLatencyCurrentLoading } = useDbQuery({
    sql: queries.find((q) => q.key === 'signInLatencyCurrent')?.sql || '',
  })

  const { data: signInLatencyPrevious, isLoading: signInLatencyPreviousLoading } = useDbQuery({
    sql: queries.find((q) => q.key === 'signInLatencyPrevious')?.sql || '',
  })

  const { data: signUpLatencyCurrent, isLoading: signUpLatencyCurrentLoading } = useDbQuery({
    sql: queries.find((q) => q.key === 'signUpLatencyCurrent')?.sql || '',
  })

  const { data: signUpLatencyPrevious, isLoading: signUpLatencyPreviousLoading } = useDbQuery({
    sql: queries.find((q) => q.key === 'signUpLatencyPrevious')?.sql || '',
  })

  const currentUserCount = activeUsersCurrent?.[0]?.count || 0
  const previousUserCount = activeUsersPrevious?.[0]?.count || 0
  const currentPasswordResets = passwordResetCurrent?.[0]?.count || 0
  const previousPasswordResets = passwordResetPrevious?.[0]?.count || 0
  const currentSignInLatency = signInLatencyCurrent?.[0]?.avg_latency_ms || 0
  const previousSignInLatency = signInLatencyPrevious?.[0]?.avg_latency_ms || 0
  const currentSignUpLatency = signUpLatencyCurrent?.[0]?.avg_latency_ms || 0
  const previousSignUpLatency = signUpLatencyPrevious?.[0]?.avg_latency_ms || 0

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
    return config.find((c) => c.id === 'signups')
  }, [ref, startDate, endDate])

  const signInChartConfig = useMemo(() => {
    const config = createAuthReportConfig({
      projectRef: ref as string,
      startDate,
      endDate,
      interval: '1h',
      filters: { status_code: null },
    })
    return config.find((c) => c.id === 'sign-in-attempts')
  }, [ref, startDate, endDate])

  const updateDateRange = (from: string, to: string) => {
    // This would typically update the date range, but for now we'll use the fixed range
    console.log('Date range update:', from, to)
  }

  return (
    <ScaffoldSection isFullWidth>
      <div className="flex items-center justify-between mb-4">
        <ScaffoldSectionTitle>Usage</ScaffoldSectionTitle>
        <Link
          href={`/project/${ref}/reports/auth`}
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
            previous={previousUserCount}
            loading={activeUsersCurrentLoading}
            suffix=""
          />
          <StatCard
            title="Password Reset Requests"
            current={currentPasswordResets}
            previous={previousPasswordResets}
            loading={passwordResetCurrentLoading}
            suffix=""
          />
          <StatCard
            title="Sign up Latency"
            current={currentSignUpLatency}
            previous={previousSignUpLatency}
            loading={signUpLatencyCurrentLoading}
            suffix="ms"
          />
          <StatCard
            title="Sign in Latency"
            current={currentSignInLatency}
            previous={previousSignInLatency}
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
