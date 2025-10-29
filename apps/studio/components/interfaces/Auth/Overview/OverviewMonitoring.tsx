import { useQuery } from '@tanstack/react-query'
import { useParams } from 'common'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  cn,
} from 'ui'
import {
  fetchTopAuthErrorCodes,
  fetchTopResponseErrors,
  AuthErrorCodeRow,
  ResponseErrorRow,
} from './OverviewErrors.constants'
import { OverviewTable } from './OverviewTable'
import {
  ScaffoldSection,
  ScaffoldSectionContent,
  ScaffoldSectionTitle,
} from 'components/layouts/Scaffold'
import {
  calculatePercentageChange,
  fetchAllAuthMetrics,
  processAllAuthMetrics,
} from './OverviewUsage.constants'
import { StatCard } from './OverviewUsage'
import { ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { DataTableColumnStatusCode } from 'components/ui/DataTable/DataTableColumn/DataTableColumnStatusCode'
import { getStatusLevel } from 'components/interfaces/UnifiedLogs/UnifiedLogs.utils'
import dayjs from 'dayjs'

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

export const OverviewMonitoring = () => {
  const { ref } = useParams()
  const endDate = dayjs().toISOString()
  const startDate = dayjs().subtract(24, 'hour').toISOString()

  // Success rate metrics (reuse OverviewUsage fetching)
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

  // Tables
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
    <ScaffoldSection isFullWidth>
      <div className="flex items-center justify-between mb-4">
        <ScaffoldSectionTitle>Monitoring</ScaffoldSectionTitle>
      </div>
      <ScaffoldSectionContent className="gap-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <StatCard
            title="Auth API Success Rate"
            current={Math.max(0, 100 - metrics.current.apiErrorRate)}
            previous={calculatePercentageChange(
              Math.max(0, 100 - metrics.current.apiErrorRate),
              Math.max(0, 100 - metrics.previous.apiErrorRate)
            )}
            loading={currentLoading || previousLoading}
            suffix="%"
            href={`/project/${ref}/reports/auth?its=${startDate}&ite=${endDate}#monitoring`}
          />
          <StatCard
            title="Auth Server Success Rate"
            current={Math.max(0, 100 - metrics.current.authErrorRate)}
            previous={calculatePercentageChange(
              Math.max(0, 100 - metrics.current.authErrorRate),
              Math.max(0, 100 - metrics.previous.authErrorRate)
            )}
            loading={currentLoading || previousLoading}
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
                isLoading={isLoadingResp || currentLoading || previousLoading}
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
                isLoading={isLoadingCodes || currentLoading || previousLoading}
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
  )
}
