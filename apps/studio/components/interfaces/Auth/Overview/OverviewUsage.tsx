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
  getChangeColor,
  fetchAllAuthMetrics,
  processAllAuthMetrics,
  calculatePercentageChange,
} from './OverviewUsage.constants'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { ArrowUpIcon, ArrowDownIcon } from 'lucide-react'

const StatCard = ({
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
  const ArrowIcon = previous >= 0 ? ArrowUpIcon : ArrowDownIcon
  const signChar = previous > 0 ? '+' : previous < 0 ? '-' : ''

  const Inner = (
    <Card className={cn(href && 'cursor-pointer hover:bg-muted')}>
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
            <p className="text-xl font-mono">{`${formattedCurrent}${suffix}`}</p>
            <div className={cn('flex items-center gap-1 font-mono text-sm', changeColor)}>
              {!isZeroChange && <ArrowIcon className="size-3" />}
              <span>{`${signChar}${Math.abs(previous).toFixed(1)}%`}</span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )

  return href ? <Link href={href}>{Inner}</Link> : Inner
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

  const signUpsChange = calculatePercentageChange(metrics.current.signUps, metrics.previous.signUps)

  const endDate = dayjs().toISOString()
  const startDate = dayjs().subtract(24, 'hour').toISOString()

  // No charts on overview; keep date range for link only

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
            title="Active users"
            current={metrics.current.activeUsers}
            previous={activeUsersChange}
            loading={isLoading}
            href={`/project/${ref}/reports/auth#usage`}
          />
          <StatCard
            title="Sign ups"
            current={metrics.current.signUps}
            previous={signUpsChange}
            loading={isLoading}
            href={`/project/${ref}/reports/auth#usage`}
          />
          <StatCard
            title="Auth API success rate"
            current={Math.max(0, 100 - metrics.current.apiErrorRate)}
            previous={calculatePercentageChange(
              Math.max(0, 100 - metrics.current.apiErrorRate),
              Math.max(0, 100 - metrics.previous.apiErrorRate)
            )}
            loading={isLoading}
            suffix="%"
            href={`/project/${ref}/reports/auth#monitoring`}
          />
          <StatCard
            title="Auth success rate"
            current={Math.max(0, 100 - metrics.current.authErrorRate)}
            previous={calculatePercentageChange(
              Math.max(0, 100 - metrics.current.authErrorRate),
              Math.max(0, 100 - metrics.previous.authErrorRate)
            )}
            loading={isLoading}
            suffix="%"
            href={`/project/${ref}/reports/auth#monitoring`}
          />
        </div>
      </ScaffoldSectionContent>
    </ScaffoldSection>
  )
}
