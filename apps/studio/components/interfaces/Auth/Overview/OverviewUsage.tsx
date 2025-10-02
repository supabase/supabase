import {
  ScaffoldSection,
  ScaffoldSectionTitle,
  ScaffoldSectionContent,
} from 'components/layouts/Scaffold'
import { Card, CardContent, CardHeader, CardTitle, Skeleton } from 'ui'
import Link from 'next/link'
import { useParams } from 'common'
import { ChevronRight } from 'lucide-react'
import { Reports } from 'icons'
import { AUTH_QUERIES, getDateRanges } from './OverviewUsage.constants'
import useDbQuery from 'hooks/analytics/useDbQuery'
import { useMemo } from 'react'

const StatCard = ({
  title,
  current,
  previous,
  loading,
}: {
  title: string
  current: number
  previous: number
  loading: boolean
}) => {
  return (
    <Card>
      <CardContent className="flex flex-col my-1 gap-1">
        <h4 className="text-sm text-foreground-lighter mb-1">{title}</h4>
        <p className="text-2xl">{loading ? <Skeleton className="w-24 h-7" /> : current}</p>
        <p className="text-sm text-foregroudn-lighter">
          {loading ? <Skeleton className="w-16 h-5" /> : previous}
        </p>
      </CardContent>
    </Card>
  )
}

export const OverviewUsage = () => {
  const { ref } = useParams()
  const dateRanges = useMemo(() => getDateRanges(), [])
  const { current, previous } = dateRanges

  const { data: currentActiveUsers, isLoading: currentLoading } = useDbQuery({
    sql: AUTH_QUERIES.activeUsers.current(current.startDate, current.endDate),
  })

  const { data: previousActiveUsers, isLoading: previousLoading } = useDbQuery({
    sql: AUTH_QUERIES.activeUsers.previous(previous.startDate, previous.endDate),
  })

  const currentCount = currentActiveUsers?.[0]?.count || 0
  const previousCount = previousActiveUsers?.[0]?.count || 0

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
            current={currentCount}
            previous={previousCount}
            loading={currentLoading}
          />
          <StatCard title="Password Reset Requests" current={0} previous={0} loading={false} />
          <StatCard title="Sign up Latency" current={0} previous={0} loading={false} />
          <StatCard title="Sign in Latency" current={0} previous={0} loading={false} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Card className="aspect-video" />
          <Card className="aspect-video" />
        </div>
      </ScaffoldSectionContent>
    </ScaffoldSection>
  )
}
