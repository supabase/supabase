import { BookOpen, Check, ExternalLink, Eye } from 'lucide-react'
import { useRouter } from 'next/router'
import { Fragment, useMemo } from 'react'
import {
  Badge,
  Button,
  Card,
  cn,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from 'ui'
import { PageContainer } from 'ui-patterns/PageContainer'
import {
  PageSection,
  PageSectionAside,
  PageSectionContent,
  PageSectionMeta,
  PageSectionSummary,
  PageSectionTitle,
} from 'ui-patterns/PageSection'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import {
  buildGroupAssistantPrompt,
  buildTroubleshootingDocsUrl,
  formatLogTimestamp,
  formatSingleLineMessage,
  getDisplayErrorMessage,
  getFunctionRuntimeLogsSql,
  getRecentErrorGroups,
  getRecentErrorGroupsBase,
  getRecentErrorInvocationsSql,
  getRelatedExecutionIds,
  getSinceLastDeployInvocationCount,
  getSinceLastDeployInvocationCountSql,
  getSinceLastDeployInvocationPhrase,
  getSinceLastDeployLogRange,
  getStatusBadgeVariant,
  toAlertError,
  type RecentErrorGroup,
} from './EdgeFunctionRecentErrors.utils'
import { SIDEBAR_KEYS } from '@/components/layouts/ProjectLayout/LayoutSidebar/LayoutSidebarProvider'
import { AiAssistantDropdown } from '@/components/ui/AiAssistantDropdown'
import AlertError from '@/components/ui/AlertError'
import useLogsQuery from '@/hooks/analytics/useLogsQuery'
import { useAiAssistantStateSnapshot } from '@/state/ai-assistant-state'
import { useSidebarManagerSnapshot } from '@/state/sidebar-manager-state'

interface EdgeFunctionRecentErrorsProps {
  functionId?: string
  functionSlug?: string
  projectRef?: string
  updatedAt?: string | number
}

export const EdgeFunctionRecentErrors = ({
  functionId,
  functionSlug,
  projectRef,
  updatedAt,
}: EdgeFunctionRecentErrorsProps) => {
  const router = useRouter()
  const { openSidebar } = useSidebarManagerSnapshot()
  const aiAssistant = useAiAssistantStateSnapshot()
  const { isoTimestampStart, isoTimestampEnd } = useMemo(
    () => getSinceLastDeployLogRange(updatedAt),
    [updatedAt]
  )
  const emptyStateFallback =
    'Runtime errors since the last deploy will appear here when this function returns a 5xx response.'

  const isQueryEnabled = Boolean(projectRef && functionId && isoTimestampStart)
  const recentErrorInvocationsSql = useMemo(
    () => getRecentErrorInvocationsSql(functionId),
    [functionId]
  )
  const sinceLastDeployInvocationCountSql = useMemo(
    () => getSinceLastDeployInvocationCountSql(functionId),
    [functionId]
  )

  const {
    logData: recentErrorInvocations,
    isLoading: isLoadingRecentErrorInvocations,
    error: recentErrorInvocationsError,
  } = useLogsQuery(
    projectRef as string,
    {
      sql: recentErrorInvocationsSql,
      iso_timestamp_start: isoTimestampStart,
      iso_timestamp_end: isoTimestampEnd,
    },
    isQueryEnabled
  )

  const recentErrorGroupsBase = useMemo(
    () => getRecentErrorGroupsBase(recentErrorInvocations),
    [recentErrorInvocations]
  )
  const {
    logData: sinceLastDeployInvocationCountRows,
    isLoading: isLoadingSinceLastDeployInvocationCount,
    error: sinceLastDeployInvocationCountError,
  } = useLogsQuery(
    projectRef as string,
    {
      sql: sinceLastDeployInvocationCountSql,
      iso_timestamp_start: isoTimestampStart,
      iso_timestamp_end: isoTimestampEnd,
    },
    Boolean(projectRef && sinceLastDeployInvocationCountSql && isoTimestampStart)
  )

  const relatedExecutionIds = useMemo(
    () => getRelatedExecutionIds(recentErrorGroupsBase),
    [recentErrorGroupsBase]
  )

  const functionRuntimeLogsSql = useMemo(
    () => getFunctionRuntimeLogsSql({ functionId, executionIds: relatedExecutionIds }),
    [functionId, relatedExecutionIds]
  )

  const {
    logData: functionRuntimeLogs,
    isLoading: isLoadingFunctionRuntimeLogs,
    error: functionRuntimeLogsError,
  } = useLogsQuery(
    projectRef as string,
    {
      sql: functionRuntimeLogsSql,
      iso_timestamp_start: isoTimestampStart,
      iso_timestamp_end: isoTimestampEnd,
    },
    Boolean(projectRef && functionRuntimeLogsSql && isoTimestampStart)
  )
  const queryError =
    toAlertError(recentErrorInvocationsError) ?? toAlertError(functionRuntimeLogsError)

  const recentErrorGroups = useMemo(
    () => getRecentErrorGroups({ recentErrorGroupsBase, functionRuntimeLogs }),
    [functionRuntimeLogs, recentErrorGroupsBase]
  )
  const sinceLastDeployInvocationCount = useMemo(
    () => getSinceLastDeployInvocationCount(sinceLastDeployInvocationCountRows),
    [sinceLastDeployInvocationCountRows]
  )
  const emptyStateMessage = useMemo(() => {
    if (!isoTimestampStart || sinceLastDeployInvocationCountError) return emptyStateFallback

    const verb = sinceLastDeployInvocationCount === 1 ? 'has' : 'have'
    const invocationPhrase = getSinceLastDeployInvocationPhrase(sinceLastDeployInvocationCount)

    return (
      <>
        There {verb} been <span className="text-foreground">{invocationPhrase}</span> since last
        deploy and no errors.
      </>
    )
  }, [
    emptyStateFallback,
    isoTimestampStart,
    sinceLastDeployInvocationCount,
    sinceLastDeployInvocationCountError,
  ])
  const emptyStateIcon =
    isoTimestampStart && !sinceLastDeployInvocationCountError ? (
      sinceLastDeployInvocationCount > 0 ? (
        <Check
          size={16}
          strokeWidth={1.5}
          className="mt-0.5 shrink-0 text-brand"
          aria-hidden="true"
        />
      ) : (
        <Eye
          size={16}
          strokeWidth={1.5}
          className="mt-0.5 shrink-0 text-foreground-muted"
          aria-hidden="true"
        />
      )
    ) : null

  const handleOpenAssistant = (group: RecentErrorGroup) => {
    openSidebar(SIDEBAR_KEYS.AI_ASSISTANT)
    aiAssistant.newChat({
      name: `Investigate ${functionSlug ?? 'error'}`,
      initialMessage: buildGroupAssistantPrompt(group, functionSlug),
    })
  }

  return (
    <PageSection>
      <PageSectionContent>
        <PageContainer size="full">
          <div className="flex flex-col gap-6">
            <PageSectionMeta>
              <PageSectionSummary>
                <PageSectionTitle>Errors since last deploy</PageSectionTitle>
              </PageSectionSummary>
              <PageSectionAside>
                <Button
                  type="default"
                  size="tiny"
                  icon={<ExternalLink size={14} />}
                  onClick={() =>
                    router.push(`/project/${projectRef}/functions/${functionSlug}/logs`)
                  }
                >
                  View logs
                </Button>
              </PageSectionAside>
            </PageSectionMeta>

            {recentErrorInvocationsError || functionRuntimeLogsError ? (
              <AlertError
                error={queryError}
                subject="Failed to retrieve edge function errors since the last deploy"
              />
            ) : isLoadingRecentErrorInvocations ||
              isLoadingFunctionRuntimeLogs ||
              isLoadingSinceLastDeployInvocationCount ? (
              <GenericSkeletonLoader />
            ) : recentErrorGroups.length === 0 ? (
              <div className="rounded-md border border-dashed px-5 py-6 text-sm text-foreground-light">
                <div className="flex items-start gap-3">
                  {emptyStateIcon}
                  <div>{emptyStateMessage}</div>
                </div>
              </div>
            ) : (
              <Card className="p-0 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Error</TableHead>
                      <TableHead>Count</TableHead>
                      <TableHead>Last Seen</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead className="text-right">Troubleshoot</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentErrorGroups.map((group) => {
                      const displayMessage = getDisplayErrorMessage(group)
                      const docsUrl = buildTroubleshootingDocsUrl({
                        statusCode: group.lastStatusCode,
                      })

                      return (
                        <Fragment key={group.message}>
                          <TableRow key={`${group.message}-summary`}>
                            <TableCell className="max-w-[420px]">
                              <span
                                className="block truncate whitespace-nowrap text-foreground"
                                title={displayMessage}
                              >
                                {displayMessage}
                              </span>
                            </TableCell>
                            <TableCell className="text-foreground-light">{group.count}</TableCell>
                            <TableCell className="text-foreground-light">
                              {formatLogTimestamp(group.lastSeen, 'relative')}
                            </TableCell>
                            <TableCell className="text-foreground-light">
                              {group.lastMethod ?? '-'}
                            </TableCell>
                            <TableCell>
                              {group.lastStatusCode ? (
                                <Badge
                                  variant={getStatusBadgeVariant(group.lastStatusCode)}
                                  className="font-mono"
                                >
                                  {group.lastStatusCode}
                                </Badge>
                              ) : (
                                <Badge variant="destructive" className="font-mono">
                                  Error
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-foreground-light">
                              {group.executionTime ?? '-'}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end">
                                <AiAssistantDropdown
                                  label="Ask Assistant"
                                  size="tiny"
                                  buildPrompt={() => buildGroupAssistantPrompt(group, functionSlug)}
                                  onOpenAssistant={() => handleOpenAssistant(group)}
                                  additionalDropdownItems={[
                                    {
                                      label: 'View troubleshooting guide',
                                      icon: <BookOpen size={14} />,
                                      onClick: () =>
                                        window.open(docsUrl, '_blank', 'noopener,noreferrer'),
                                    },
                                  ]}
                                />
                              </div>
                            </TableCell>
                          </TableRow>
                          <TableRow key={`${group.message}-logs`} className="hover:bg-transparent">
                            <TableCell colSpan={7} className="p-0">
                              <div className="max-h-64 overflow-auto bg-surface-75 font-mono text-xs">
                                {group.logs.length === 0 ? (
                                  <div className="px-4 py-3 text-foreground-lighter">
                                    No related runtime logs found for this error group.
                                  </div>
                                ) : (
                                  group.logs.map((log, index) => {
                                    const isError = log.level === 'error'
                                    return (
                                      <div
                                        key={log.key}
                                        className={cn(
                                          'flex items-start gap-3 px-4 py-2',
                                          index !== 0 && 'border-t border-default',
                                          isError && 'bg-destructive-200/40'
                                        )}
                                      >
                                        <span className="shrink-0 tabular-nums text-foreground-muted">
                                          {formatLogTimestamp(log.lastSeen, 'time')}
                                        </span>
                                        <Badge
                                          variant={isError ? 'destructive' : 'default'}
                                          className="shrink-0"
                                        >
                                          {log.level}
                                        </Badge>
                                        {log.count > 1 && (
                                          <span className="shrink-0 text-foreground-muted tabular-nums">
                                            ×{log.count}
                                          </span>
                                        )}
                                        <span
                                          className={cn(
                                            'flex-1 wrap-break-word whitespace-pre-wrap',
                                            isError ? 'text-destructive' : 'text-foreground-light'
                                          )}
                                        >
                                          {formatSingleLineMessage(log.message)}
                                        </span>
                                      </div>
                                    )
                                  })
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        </Fragment>
                      )
                    })}
                  </TableBody>
                </Table>
              </Card>
            )}
          </div>
        </PageContainer>
      </PageSectionContent>
    </PageSection>
  )
}
