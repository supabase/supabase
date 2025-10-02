import {
  ScaffoldSection,
  ScaffoldSectionTitle,
  ScaffoldSectionContent,
} from 'components/layouts/Scaffold'
import { Card, CardContent, Skeleton, cn } from 'ui'
import Link from 'next/link'
import { useParams } from 'common'
import { ChevronRight } from 'lucide-react'
import { Reports } from 'icons'
import { getChangeSign, getChangeColor, executeAuthQueries } from './OverviewUsage.constants'
import useDbQuery from 'hooks/analytics/useDbQuery'
import { useMemo } from 'react'

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
      <CardContent className="flex flex-col my-1 gap-1">
        <h4 className="text-sm text-foreground-lighter mb-1">{title}</h4>
        <p className="text-2xl">
          {loading ? <Skeleton className="w-24 h-7" /> : `${current}${suffix}`}
        </p>
        <p className={cn('text-sm text-foregroudn-lighter', changeColor)}>
          {loading ? <Skeleton className="w-16 h-5" /> : `${changeSign}${previous}${suffix}       `}
        </p>
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
          <Card className="aspect-video" />
          <Card className="aspect-video" />
        </div>
      </ScaffoldSectionContent>
    </ScaffoldSection>
  )
}
