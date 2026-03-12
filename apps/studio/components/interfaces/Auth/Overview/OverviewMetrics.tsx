import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { ChevronRight, ExternalLink, Telescope, BarChart2, Bot } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'

import { useParams } from 'common'
import { getStatusLevel } from 'components/interfaces/UnifiedLogs/UnifiedLogs.utils'
import AlertError from 'components/ui/AlertError'
import { cn, Tooltip, TooltipContent, TooltipTrigger, Button } from 'ui'
import {
  PageSection,
  PageSectionContent,
  PageSectionMeta,
  PageSectionSummary,
  PageSectionTitle,
} from 'ui-patterns/PageSection'
import {
  Chart,
  ChartCard,
  ChartHeader,
  ChartActions,
  ChartMetric,
  ChartTitle,
  ChartContent,
  ChartEmptyState,
  ChartLoadingState,
} from 'ui-patterns/Chart'
import {
  AuthErrorCodeRow,
  fetchTopAuthErrorCodes,
  fetchTopResponseErrors,
  ResponseErrorRow,
} from './OverviewErrors.constants'
import { OverviewTable } from './OverviewTable'
import {
  AuthMetricsResponse,
  calculatePercentageChange,
  getApiSuccessRates,
  getAuthSuccessRates,
  getMetricValues,
} from './OverviewUsage.constants'
import { getStatusColor } from 'components/ui/DataTable/DataTable.utils'
import { ErrorCodeTooltip } from '../../Settings/Logs/ErrorCodeTooltip'
import { Service } from 'data/graphql/graphql'
import { AiIconAnimation } from 'ui'
import { SIDEBAR_KEYS } from 'components/layouts/ProjectLayout/LayoutSidebar/LayoutSidebarProvider'
import { useAiAssistantStateSnapshot } from 'state/ai-assistant-state'
import { useSidebarManagerSnapshot } from 'state/sidebar-manager-state'

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
  const formattedCurrent =
    suffix === 'ms'
      ? current.toFixed(2)
      : suffix === '%'
        ? current.toFixed(1)
        : Math.round(current).toLocaleString()
  // const signChar = previous > 0 ? '+' : previous < 0 ? '-' : ''

  const actions = [
    {
      label: 'Go to Auth Report',
      icon: <ExternalLink size={12} />,
      onClick: href ? () => router.push(href) : undefined,
    },
  ]

  return (
    <Chart isLoading={loading}>
      <ChartCard>
        <ChartHeader align="start">
          <ChartMetric
            className="pb-4"
            label={title}
            tooltip={tooltip}
            diffValue={`${previous.toFixed(1)}%`}
            value={`${formattedCurrent}${suffix}`}
          />
          <ChartActions actions={actions} />
        </ChartHeader>
      </ChartCard>
    </Chart>
  )
}

const LogsLink = ({ href }: { href: string }) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <Button
        type="text"
        size="tiny"
        className="p-1.5 text-foreground-lighter hover:text-foreground"
        asChild
      >
        <Link href={href} aria-label="Go to Logs">
          <ChevronRight size={12} />
        </Link>
      </Button>
    </TooltipTrigger>
    <TooltipContent>Go to Logs</TooltipContent>
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
  const aiSnap = useAiAssistantStateSnapshot()
  const { openSidebar } = useSidebarManagerSnapshot()

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

  const { data: respErrData, isPending: isLoadingResp } = useQuery({
    queryKey: ['auth-overview', ref, 'top-response-errors'],
    queryFn: () => fetchTopResponseErrors(ref as string),
    enabled: !!ref,
  })

  const { data: codeErrData, isPending: isLoadingCodes } = useQuery({
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

  const errorCodesActions = [
    {
      label: 'Ask Assistant about Error Codes',
      icon: <AiIconAnimation size={12} />,
      onClick: () => {
        openSidebar(SIDEBAR_KEYS.AI_ASSISTANT)
        aiSnap.newChat({
          name: 'Auth Help',
          initialInput: `Can you explain to me what the authentication error codes mean?`,
        })
      },
    },
  ]

  return (
    <>
      <PageSection>
        {!!error && (
          <AlertError
            className="mb-4"
            subject="Error fetching auth metrics"
            error={{
              message: 'There was an error fetching the auth metrics.',
            }}
          />
        )}
        <PageSectionMeta>
          <PageSectionSummary>
            <div className="flex items-center justify-between">
              <PageSectionTitle>Usage</PageSectionTitle>
              <Link
                href={`/project/${ref}/reports/auth?its=${startDate}&ite=${endDate}&isHelper=true&helperText=Last+24+hours`}
                className="text-foreground underline underline-offset-2 decoration-foreground-muted hover:decoration-foreground transition-all text-sm inline-flex items-center gap-x-1.5"
              >
                <Telescope size={14} className="text-foreground-lighter" />
                <span>Go to observability</span>
                <ChevronRight size={14} className="text-foreground-lighter" />
              </Link>
            </div>
          </PageSectionSummary>
        </PageSectionMeta>
        <PageSectionContent>
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
        </PageSectionContent>
      </PageSection>

      <PageSection>
        <PageSectionMeta>
          <PageSectionSummary>
            <PageSectionTitle>Monitoring</PageSectionTitle>
          </PageSectionSummary>
        </PageSectionMeta>
        <PageSectionContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
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

          <div className="grid grid-cols-1 gap-4">
            <Chart isLoading={isLoadingResp}>
              <ChartCard>
                <ChartHeader>
                  <ChartTitle>Auth API Errors</ChartTitle>
                </ChartHeader>
                <ChartContent
                  className="!p-0"
                  isEmpty={responseErrors.length === 0}
                  emptyState={
                    <div className="p-6">
                      <ChartEmptyState
                        icon={<BarChart2 size={16} />}
                        title="No data to show"
                        description="It may take up to 24 hours for data to refresh"
                      />
                    </div>
                  }
                  loadingState={
                    <div className="p-6">
                      <ChartLoadingState />
                    </div>
                  }
                >
                  <OverviewTable<ResponseErrorRow>
                    isLoading={isLoadingResp}
                    data={responseErrors}
                    columns={[
                      {
                        key: 'request',
                        header: 'Request',
                        className: 'w-auto !pr-0',
                        render: (row) => {
                          const level = getStatusLevel(row.status_code)
                          const colors = getStatusColor(level)
                          return (
                            <div className="flex items-center gap-2">
                              <span className="flex-shrink-0 flex items-center text-xs font-mono">
                                <span className="select-text py-0.5 px-2 text-center rounded-l rounded-r-none bg-surface-75 text-foreground-light border border-r-0">
                                  {row.method}
                                </span>
                                <span
                                  className={cn(
                                    'py-0.5 px-2 border rounded-l-0 rounded-r tabular-nums',
                                    colors.text,
                                    colors.bg,
                                    colors.border
                                  )}
                                >
                                  {row.status_code}
                                </span>
                              </span>
                            </div>
                          )
                        },
                      },
                      {
                        key: 'path',
                        header: 'Path',
                        className: 'w-full',
                        render: (row) => (
                          <span className="line-clamp-1 font-mono text-foreground-light text-xs">
                            {row.path}
                          </span>
                        ),
                      },
                      {
                        key: 'count',
                        header: 'Count',
                        className: 'text-right flex-shrink-0 ml-auto justify-end',
                        render: (row) => (
                          <div className="flex justify-end items-center gap-2">
                            <div className="text-right text-xs tabular-nums">{row.count}</div>
                            <LogsLink href={`/project/${ref}/logs/edge-logs?s=${row.path}`} />
                          </div>
                        ),
                      },
                    ]}
                  />
                </ChartContent>
              </ChartCard>
            </Chart>

            <Chart isLoading={isLoadingCodes}>
              <ChartCard>
                <ChartHeader>
                  <ChartTitle>Auth Server Errors</ChartTitle>
                  <ChartActions actions={errorCodesActions} />
                </ChartHeader>
                <ChartContent
                  className="!p-0"
                  isEmpty={errorCodes.length === 0}
                  emptyState={
                    <div className="p-6">
                      <ChartEmptyState
                        icon={<BarChart2 size={16} />}
                        title="No data to show"
                        description="It may take up to 24 hours for data to refresh"
                      />
                    </div>
                  }
                  loadingState={
                    <div className="p-6">
                      <ChartLoadingState />
                    </div>
                  }
                >
                  <OverviewTable<AuthErrorCodeRow>
                    isLoading={isLoadingCodes}
                    data={errorCodes}
                    columns={[
                      {
                        key: 'error_code',
                        header: 'Error code',
                        className: 'w-full',
                        render: (row) => (
                          <ErrorCodeTooltip errorCode={row.error_code} service={Service.Auth}>
                            <span className="line-clamp-1 font-mono uppercase text-xs inline-flex text-foreground-light cursor-default">
                              {row.error_code}
                            </span>
                          </ErrorCodeTooltip>
                        ),
                      },
                      {
                        key: 'count',
                        header: 'Count',
                        className: 'text-right',
                        render: (row) => (
                          <div className="flex justify-end items-center gap-2">
                            <div className="text-right text-xs tabular-nums">{row.count}</div>
                            <LogsLink href={`/project/${ref}/logs/auth-logs?s=${row.error_code}`} />
                          </div>
                        ),
                      },
                    ]}
                  />
                </ChartContent>
              </ChartCard>
            </Chart>
          </div>
        </PageSectionContent>
      </PageSection>
    </>
  )
}
