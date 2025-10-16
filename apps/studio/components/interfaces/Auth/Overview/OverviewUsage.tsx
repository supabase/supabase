import {
  ScaffoldSection,
  ScaffoldSectionTitle,
  ScaffoldSectionContent,
} from 'components/layouts/Scaffold'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  cn,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from 'ui'
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
import AlertError from 'components/ui/AlertError'

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
    <Card className={cn(href)}>
      <CardHeader className="flex flex-row items-center justify-between p-2 pl-4 pr-2 space-y-0">
        <CardTitle className="text-foreground-lighter">{title}</CardTitle>
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              href={href || ''}
              className="text-foreground-lighter hover:text-foreground block p-2"
            >
              <ChevronRight className="size-4" />
            </Link>
          </TooltipTrigger>
          <TooltipContent>Go to Auth Report</TooltipContent>
        </Tooltip>
      </CardHeader>
      <CardContent
        className={cn(
          'flex flex-col my-1 gap-1 px-5',
          loading && 'opacity-50 items-center justify-center min-h-[108px]'
        )}
      >
        {loading ? (
          <Loader2 className="size-5 animate-spin text-foreground-light" />
        ) : (
          <>
            <p className="text-xl">{`${formattedCurrent}${suffix}`}</p>
            <div className={cn('flex items-center gap-1 text-sm', changeColor)}>
              <span>{`${signChar}${Math.abs(previous).toFixed(1)}%`}</span>
            </div>
          </>
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
        <div className="grid grid-cols-2 gap-3">
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
