import { useQuery } from '@tanstack/react-query'
import { useFlag, useParams } from 'common'
import dayjs from 'dayjs'
import { BarChart2, ChevronRight, ExternalLink, Telescope } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { AiIconAnimation, Button, Tooltip, TooltipContent, TooltipTrigger } from 'ui'
import {
  Chart,
  ChartActions,
  ChartCard,
  ChartContent,
  ChartEmptyState,
  ChartHeader,
  ChartLoadingState,
  ChartMetric,
  ChartTitle,
} from 'ui-patterns/Chart'
import {
  PageSection,
  PageSectionContent,
  PageSectionMeta,
  PageSectionSummary,
  PageSectionTitle,
} from 'ui-patterns/PageSection'
import { StatusCode } from 'ui-patterns/StatusCode'

import {
  AuthErrorCodeRow,
  fetchTopAuthErrorCodes,
  fetchTopResponseErrors,
  parseAuthErrorCodes,
  parseResponseErrors,
  ResponseErrorRow,
} from './OverviewErrors.constants'
import { formatMetricChange, formatMetricValue } from './OverviewMetrics.utils'
import { OverviewTable } from './OverviewTable'
import {
  AuthMetricsResponse,
  calculatePercentageChange,
  calculatePercentagePointChange,
  getApiSuccessRates,
  getAuthSuccessRates,
  getMetricValues,
} from './OverviewUsage.constants'
import { SIDEBAR_KEYS } from '@/components/layouts/ProjectLayout/LayoutSidebar/LayoutSidebarProvider'
import { AlertError } from '@/components/ui/AlertError'
import { ErrorCodeTooltip } from '@/components/ui/ErrorCodeTooltip/ErrorCodeTooltip'
import { Service } from '@/data/graphql/graphql'
import { useAiAssistantStateSnapshot } from '@/state/ai-assistant-state'
import { useSidebarManagerSnapshot } from '@/state/sidebar-manager-state'

const StatCard = ({
  title,
  current,
  change,
  loading,
  suffix = '',
  href,
  tooltip,
}: {
  title: string
  current: number | null
  change: number | null
  loading: boolean
  suffix?: string
  href?: string
  tooltip?: string
}) => {
  const router = useRouter()

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
            diffValue={formatMetricChange(change, suffix)}
            value={formatMetricValue(current, suffix)}
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
        variant="text"
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

interface OverviewMetricsProps {
  metrics?: AuthMetricsResponse
  isLoading: boolean
  error: unknown
}

export const OverviewMetrics = ({ metrics, isLoading, error }: OverviewMetricsProps) => {
  const { ref } = useParams()
  const useOtel = useFlag('otelLegacyLogs')
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

  const apiSuccessRateChange = calculatePercentagePointChange(
    apiSuccessRateCurrent,
    apiSuccessRatePrevious
  )
  const authSuccessRateChange = calculatePercentagePointChange(
    authSuccessRateCurrent,
    authSuccessRatePrevious
  )

  const {
    data: respErrData,
    isPending: isLoadingResp,
    isError: isResponseError,
    error: responseError,
  } = useQuery({
    queryKey: ['auth-overview', ref, 'top-response-errors', { otel: useOtel }],
    queryFn: () => fetchTopResponseErrors(ref as string, useOtel),
    enabled: !!ref,
  })

  const {
    data: codeErrData,
    isPending: isLoadingCodes,
    isError: isCodeError,
    error: codeError,
  } = useQuery({
    queryKey: ['auth-overview', ref, 'top-auth-error-codes', { otel: useOtel }],
    queryFn: () => fetchTopAuthErrorCodes(ref as string, useOtel),
    enabled: !!ref,
  })

  const responseErrors: ResponseErrorRow[] = Array.isArray(respErrData?.result)
    ? parseResponseErrors(respErrData.result)
    : []
  const errorCodes: AuthErrorCodeRow[] = Array.isArray(codeErrData?.result)
    ? parseAuthErrorCodes(codeErrData.result)
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
              change={activeUsersChange}
              loading={isLoading}
              href={`/project/${ref}/reports/auth?its=${startDate}&ite=${endDate}#usage`}
              tooltip="Users who generated any Auth event in this period. This metric tracks authentication activity, not total product usage. Some active users won't appear here if their session stayed valid."
            />
            <StatCard
              title="Sign ups"
              current={signUpsCurrent}
              change={signUpsChange}
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
              change={apiSuccessRateChange}
              loading={isLoading}
              suffix="%"
              tooltip="Change from the previous period in percentage points (pp); no data means no requests were recorded."
              href={`/project/${ref}/reports/auth?its=${startDate}&ite=${endDate}#monitoring`}
            />
            <StatCard
              title="Auth Server Success Rate"
              current={authSuccessRateCurrent}
              change={authSuccessRateChange}
              loading={isLoading}
              suffix="%"
              tooltip="Change from the previous period in percentage points (pp); no data means no requests were recorded."
              href={`/project/${ref}/reports/auth?its=${startDate}&ite=${endDate}#monitoring`}
            />
          </div>

          <div className="grid grid-cols-1 gap-4">
            <Chart isLoading={isLoadingResp} isErrored={isResponseError}>
              <ChartCard>
                <ChartHeader>
                  <ChartTitle>Auth API Errors</ChartTitle>
                </ChartHeader>
                <ChartContent
                  className="p-0!"
                  isEmpty={responseErrors.length === 0}
                  errorState={
                    <div className="p-6">
                      <AlertError
                        projectRef={ref}
                        subject="Failed to retrieve Auth API errors"
                        error={responseError}
                      />
                    </div>
                  }
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
                        className: 'w-auto pr-0!',
                        render: (row) => {
                          return <StatusCode method={row.method} statusCode={row.status_code} />
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
                        className: 'text-right shrink-0 ml-auto justify-end',
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

            <Chart isLoading={isLoadingCodes} isErrored={isCodeError}>
              <ChartCard>
                <ChartHeader>
                  <ChartTitle>Auth Server Errors</ChartTitle>
                  <ChartActions actions={errorCodesActions} />
                </ChartHeader>
                <ChartContent
                  className="p-0!"
                  isEmpty={errorCodes.length === 0}
                  errorState={
                    <div className="p-6">
                      <AlertError
                        projectRef={ref}
                        subject="Failed to retrieve Auth server errors"
                        error={codeError}
                      />
                    </div>
                  }
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
