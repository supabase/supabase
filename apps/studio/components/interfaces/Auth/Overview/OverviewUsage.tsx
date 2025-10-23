import {
  ScaffoldSection,
  ScaffoldSectionTitle,
  ScaffoldSectionContent,
} from 'components/layouts/Scaffold'
import { Card, CardContent, CardHeader, CardTitle, cn, Skeleton } from 'ui'
import Link from 'next/link'
import { useParams } from 'common'
import { ChevronRight, ExternalLink } from 'lucide-react'
import { Reports } from 'icons'
import {
  getChangeColor,
  fetchAllAuthMetrics,
  processAllAuthMetrics,
  calculatePercentageChange,
} from './OverviewUsage.constants'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import AlertError from 'components/ui/AlertError'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { useRouter } from 'next/router'

export const StatCard = ({
  title,
  current,
  previous,
  loading,
  suffix = '',
  invert = false,
  href,
}: {
  title: string
  current: number
  previous: number
  loading: boolean
  suffix?: string
  invert?: boolean
  href?: string
}) => {
  const router = useRouter()
  const isZeroChange = previous === 0
  const changeColor = isZeroChange
    ? 'text-foreground-lighter'
    : invert
      ? previous >= 0
        ? 'text-destructive'
        : 'text-brand'
      : getChangeColor(previous)
  const formattedCurrent =
    suffix === 'ms' ? current.toFixed(2) : suffix === '%' ? current.toFixed(1) : Math.round(current)
  const signChar = previous > 0 ? '+' : previous < 0 ? '-' : ''

  return (
    <Card className={cn(href, 'mb-0 flex flex-col')}>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-0 border-b-0 relative">
        <CardTitle className="text-foreground-light">{title}</CardTitle>
        <ButtonTooltip
          type="text"
          size="tiny"
          icon={<ExternalLink />}
          className="w-6 h-6 absolute right-4 top-3"
          onClick={() => router.push(href || '')}
          tooltip={{
            content: {
              side: 'top',
              text: 'Go to Auth Report',
            },
          }}
        />
      </CardHeader>
      <CardContent
        className={cn(
          'pb-4 px-6 pt-0 flex-1 h-full overflow-hidden',
          loading && 'pt-2 opacity-50 items-center justify-center'
        )}
      >
        {loading ? (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-3 w-8" />
          </div>
        ) : (
          <div className="flex flex-col gap-0.5">
            <p className="text-xl">{`${formattedCurrent}${suffix}`}</p>
            <span className={cn('flex items-center gap-1 text-sm', changeColor)}>
              <span>{`${signChar}${Math.abs(previous).toFixed(1)}%`}</span>
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export const OverviewUsage = () => {
  const { ref } = useParams()

  const {
    data: currentData,
    isLoading: currentLoading,
    error: currentError,
  } = useQuery({
    queryKey: ['auth-metrics', ref, 'current'],
    queryFn: () => fetchAllAuthMetrics(ref as string, 'current'),
    enabled: !!ref,
  })

  const {
    data: previousData,
    isLoading: previousLoading,
    error: previousError,
  } = useQuery({
    queryKey: ['auth-metrics', ref, 'previous'],
    queryFn: () => fetchAllAuthMetrics(ref as string, 'previous'),
    enabled: !!ref,
  })

  const metrics = processAllAuthMetrics(currentData?.result || [], previousData?.result || [])
  const isLoading = currentLoading || previousLoading
  const isError = !!previousError || !!currentError
  const errorMessage =
    (previousError as any)?.message ||
    (currentError as any)?.message ||
    'There was an error fetching the auth metrics.'

  const activeUsersChange = calculatePercentageChange(
    metrics.current.activeUsers,
    metrics.previous.activeUsers
  )

  const signUpsChange = calculatePercentageChange(metrics.current.signUps, metrics.previous.signUps)

  const endDate = dayjs().toISOString()
  const startDate = dayjs().subtract(24, 'hour').toISOString()

  // No charts on overview; keep date range for link only

  return (
    <ScaffoldSection isFullWidth>
      {isError && (
        <AlertError
          className="mb-4"
          subject="Error fetching auth metrics"
          error={{
            message: errorMessage,
          }}
        />
      )}
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <StatCard
            title="Active users"
            current={metrics.current.activeUsers}
            previous={activeUsersChange}
            loading={isLoading}
            href={`/project/${ref}/reports/auth?its=${startDate}&ite=${endDate}#usage`}
          />
          <StatCard
            title="Sign ups"
            current={metrics.current.signUps}
            previous={signUpsChange}
            loading={isLoading}
            href={`/project/${ref}/reports/auth?its=${startDate}&ite=${endDate}#usage`}
          />
        </div>
      </ScaffoldSectionContent>
    </ScaffoldSection>
  )
}
