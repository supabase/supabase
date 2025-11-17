import { useQuery } from '@tanstack/react-query'
import { useParams } from 'common'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  cn,
  Skeleton,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from 'ui'
import Link from 'next/link'
import { ChevronRight, ExternalLink, HelpCircle } from 'lucide-react'
import { Reports } from 'icons'
import {
  ScaffoldSection,
  ScaffoldSectionTitle,
  ScaffoldSectionContent,
} from 'components/layouts/Scaffold'
import {
  calculatePercentageChange,
  getChangeColor,
  getMetricValues,
  AuthMetricsResponse,
  getApiSuccessRates,
  getAuthSuccessRates,
} from './OverviewUsage.constants'
import {
  fetchTopAuthErrorCodes,
  fetchTopResponseErrors,
  AuthErrorCodeRow,
  ResponseErrorRow,
} from './OverviewErrors.constants'
import { OverviewTable } from './OverviewTable'
import dayjs from 'dayjs'
import AlertError from 'components/ui/AlertError'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { useRouter } from 'next/router'
import { DataTableColumnStatusCode } from 'components/ui/DataTable/DataTableColumn/DataTableColumnStatusCode'
import { getStatusLevel } from 'components/interfaces/UnifiedLogs/UnifiedLogs.utils'

const StatCard = ({
  title,
  current,
  previous,
  loading,
  suffix = '',
  invert = false,
  href,
  tooltip,
}: {
  title: string
  current: number
  previous: number
  loading: boolean
  suffix?: string
  invert?: boolean
  href?: string
  tooltip?: string
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
    suffix === 'ms'
      ? current.toFixed(2)
      : suffix === '%'
        ? current.toFixed(1)
        : Math.round(current).toLocaleString()
  const signChar = previous > 0 ? '+' : previous < 0 ? '-' : ''

  return (
    <Card className={cn(href, 'mb-0 flex flex-col')}>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-0 border-b-0 relative">
        <CardTitle className="text-foreground-light flex items-center gap-2">
          {title}
          {tooltip && (
            <Tooltip>
              <TooltipTrigger>
                <HelpCircle className="text-foreground-light" size={14} strokeWidth={1.5} />
              </TooltipTrigger>
              <TooltipContent className="w-[300px]">
                <p>{tooltip}</p>
              </TooltipContent>
            </Tooltip>
          )}
        </CardTitle>
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

const LogsLink = ({ href }: { href: string }) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <Link className="block text-foreground-lighter hover:text-foreground p-1.5" href={href}>
        <ChevronRight className="size-4" />
      </Link>
    </TooltipTrigger>
    <TooltipContent>Go to logs</TooltipContent>
  </Tooltip>
)

function isResponseErrorRow(row: unknown): row is ResponseErrorRow {
  if (!row || typeof row !== 'object') return false
  const r = row as Record<string, unknown>
  return (
    typeof r.method === 'string' &&
    typeof r.path === 'string' &&
    typeof r.status_code === 'number' &&
    typeof r.count === 'number'
  )
}

function isAuthErrorCodeRow(row: unknown): row is AuthErrorCodeRow {
  if (!row || typeof row !== 'object') return false
  const r = row as Record<string, unknown>
  return typeof r.error_code === 'string' && typeof r.count === 'number'
}

interface OverviewMetricsProps {
  metrics?: AuthMetricsResponse
  isLoading: boolean
  error: unknown
}

export const OverviewMetrics = ({ metrics, isLoading, error }: OverviewMetricsProps) => {
  const { ref } = useParams()
  const endDate = dayjs().toISOString()
  const startDate = dayjs().subtract(24, 'hour').toISOString()

  const { current: activeUsersCurrent, previous: activeUsersPrevious } = getMetricValues(
    metrics,
    'activeUsers'
  )

  const { current: signUpsCurrent, previous: signUpsPrevious } = getMetricValues(
    metrics,
    'signUpCount'
  )

  const activeUsersChange = calculatePercentageChange(activeUsersCurrent, activeUsersPrevious)
  const signUpsChange = calculatePercentageChange(signUpsCurrent, signUpsPrevious)

  const { current: apiSuccessRateCurrent, previous: apiSuccessRatePrevious } =
    getApiSuccessRates(metrics)
  const { current: authSuccessRateCurrent, previous: authSuccessRatePrevious } =
    getAuthSuccessRates(metrics)

  const apiSuccessRateChange = calculatePercentageChange(
    apiSuccessRateCurrent,
    apiSuccessRatePrevious
  )
  const authSuccessRateChange = calculatePercentageChange(
    authSuccessRateCurrent,
    authSuccessRatePrevious
  )

  const { data: respErrData, isLoading: isLoadingResp } = useQuery({
    queryKey: ['auth-overview', ref, 'top-response-errors'],
    queryFn: () => fetchTopResponseErrors(ref as string),
    enabled: !!ref,
  })

  const { data: codeErrData, isLoading: isLoadingCodes } = useQuery({
    queryKey: ['auth-overview', ref, 'top-auth-error-codes'],
    queryFn: () => fetchTopAuthErrorCodes(ref as string),
    enabled: !!ref,
  })

  const responseErrors: ResponseErrorRow[] = Array.isArray(respErrData?.result)
    ? (respErrData?.result as unknown[]).filter(isResponseErrorRow)
    : []
  const errorCodes: AuthErrorCodeRow[] = Array.isArray(codeErrData?.result)
    ? (codeErrData?.result as unknown[]).filter(isAuthErrorCodeRow)
    : []

  return (
    <>
      <ScaffoldSection isFullWidth>
        {!!error && (
          <AlertError
            className="mb-4"
            subject="Error fetching auth metrics"
            error={{
              message: 'There was an error fetching the auth metrics.',
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
              title="Auth Activity"
              current={activeUsersCurrent}
              previous={activeUsersChange}
              loading={isLoading}
              href={`/project/${ref}/reports/auth?its=${startDate}&ite=${endDate}#usage`}
              tooltip="Users who generated any Auth event in this period. This metric tracks authentication activity, not total product usage. Some active users won't appear here if their session stayed valid."
            />
            <StatCard
              title="Sign ups"
              current={signUpsCurrent}
              previous={signUpsChange}
              loading={isLoading}
              href={`/project/${ref}/reports/auth?its=${startDate}&ite=${endDate}#usage`}
            />
          </div>
        </ScaffoldSectionContent>
      </ScaffoldSection>

      <ScaffoldSection isFullWidth>
        <div className="flex items-center justify-between mb-4">
          <ScaffoldSectionTitle>Monitoring</ScaffoldSectionTitle>
        </div>
        <ScaffoldSectionContent className="gap-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <StatCard
              title="Auth API Success Rate"
              current={apiSuccessRateCurrent}
              previous={apiSuccessRateChange}
              loading={isLoading}
              suffix="%"
              href={`/project/${ref}/reports/auth?its=${startDate}&ite=${endDate}#monitoring`}
            />
            <StatCard
              title="Auth Server Success Rate"
              current={authSuccessRateCurrent}
              previous={authSuccessRateChange}
              loading={isLoading}
              suffix="%"
              href={`/project/${ref}/reports/auth?its=${startDate}&ite=${endDate}#monitoring`}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader className={cn('border-b-0', responseErrors.length > 0 ? 'pb-4' : 'pb-0')}>
                <CardTitle className="text-foreground-light">Auth API Errors</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <OverviewTable<ResponseErrorRow>
                  isLoading={isLoadingResp}
                  data={responseErrors}
                  columns={[
                    {
                      key: 'request',
                      header: 'Request',
                      className: 'w-[60px]',
                      render: (row) => (
                        <span className="font-mono text-xs truncate select-text cursor-text py-1 px-1.5 text-center rounded-md bg-alternative-200">
                          {row.method}
                        </span>
                      ),
                    },
                    {
                      key: 'status_code',
                      header: 'Status',
                      className: 'w-[60px]',
                      render: (row) => (
                        <DataTableColumnStatusCode
                          value={row.status_code}
                          level={getStatusLevel(row.status_code)}
                          className="text-sm"
                        />
                      ),
                    },
                    {
                      key: 'path',
                      header: 'Path',
                      className: 'flex-shrink-0 w-52',
                      render: (row) => (
                        <div className="line-clamp-1 font-mono text-foreground-light text-xs">
                          {row.path}
                        </div>
                      ),
                    },
                    {
                      key: 'count',
                      header: 'Count',
                      className: 'text-right flex-shrink-0 ml-auto justify-end',
                      render: (row) => (
                        <div className="text-right text-xs tabular-nums">{row.count}</div>
                      ),
                    },
                    {
                      key: 'actions',
                      header: '',
                      className: 'w-6',
                      render: (row) => (
                        <div className="flex justify-end">
                          <LogsLink href={`/project/${ref}/logs/edge-logs?s=${row.path}`} />
                        </div>
                      ),
                    },
                  ]}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className={cn('border-b-0', errorCodes.length > 0 ? 'pb-4' : 'pb-0')}>
                <CardTitle className="text-foreground-light">Auth Server Errors</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <OverviewTable<AuthErrorCodeRow>
                  isLoading={isLoadingCodes}
                  data={errorCodes}
                  columns={[
                    {
                      key: 'error_code',
                      header: 'Error code',
                      className: 'w-full',
                      render: (row) => (
                        <div className="line-clamp-1 font-mono text-foreground uppercase text-xs">
                          {row.error_code}
                        </div>
                      ),
                    },
                    {
                      key: 'count',
                      header: 'Count',
                      className: 'text-right',
                      render: (row) => (
                        <div className="text-right text-xs tabular-nums">{row.count}</div>
                      ),
                    },
                    {
                      key: 'actions',
                      header: '',
                      className: 'text-right',
                      render: (row) => (
                        <div>
                          <LogsLink href={`/project/${ref}/logs/auth-logs?s=${row.error_code}`} />
                        </div>
                      ),
                    },
                  ]}
                />
              </CardContent>
            </Card>
          </div>
        </ScaffoldSectionContent>
      </ScaffoldSection>
    </>
  )
}
