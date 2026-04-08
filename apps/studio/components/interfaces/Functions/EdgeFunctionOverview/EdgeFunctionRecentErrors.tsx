import { ExternalLink } from 'lucide-react'
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
  formatLogTimestamp,
  formatSingleLineMessage,
  getFunctionRuntimeLogsSql,
  getRecentErrorGroups,
  getRecentErrorGroupsBase,
  getRecentErrorInvocationsSql,
  getRelatedExecutionIds,
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
  isoTimestampStart?: string
  isoTimestampEnd?: string
}

export const EdgeFunctionRecentErrors = ({
  functionId,
  functionSlug,
  projectRef,
  isoTimestampStart,
  isoTimestampEnd,
}: EdgeFunctionRecentErrorsProps) => {
  const router = useRouter()
  const { openSidebar } = useSidebarManagerSnapshot()
  const aiAssistant = useAiAssistantStateSnapshot()

  const isQueryEnabled = Boolean(projectRef && functionId)
  const recentErrorInvocationsSql = useMemo(
    () => getRecentErrorInvocationsSql(functionId),
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
    Boolean(projectRef && functionRuntimeLogsSql)
  )
  const queryError =
    toAlertError(recentErrorInvocationsError) ?? toAlertError(functionRuntimeLogsError)

  const recentErrorGroups = useMemo(
    () => getRecentErrorGroups({ recentErrorGroupsBase, functionRuntimeLogs }),
    [functionRuntimeLogs, recentErrorGroupsBase]
  )

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
                <PageSectionTitle>Recent Failed Invocations</PageSectionTitle>
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
                subject="Failed to retrieve recent edge function errors"
              />
            ) : isLoadingRecentErrorInvocations || isLoadingFunctionRuntimeLogs ? (
              <GenericSkeletonLoader />
            ) : recentErrorGroups.length === 0 ? (
              <div className="rounded-md border border-dashed px-4 py-6 text-sm text-foreground-light">
                Recent runtime errors will appear here when this function returns a 5xx response.
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
                      <TableHead className="text-right">Assistant</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentErrorGroups.map((group) => (
                      <Fragment key={group.message}>
                        <TableRow key={`${group.message}-summary`}>
                          <TableCell className="max-w-[420px]">
                            <span
                              className="block truncate whitespace-nowrap text-foreground"
                              title={formatSingleLineMessage(group.message)}
                            >
                              {formatSingleLineMessage(group.message)}
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
                              />
                            </div>
                          </TableCell>
                        </TableRow>
                        <TableRow key={`${group.message}-logs`} className="bg-surface-100/30">
                          <TableCell colSpan={7} className="p-0">
                            <div className="max-h-64 overflow-auto bg-surface-75 py-3 text-foreground-light">
                              {group.logs.length === 0 ? (
                                <div className="px-4">
                                  No related runtime logs found for this error group.
                                </div>
                              ) : (
                                group.logs.map((log) => (
                                  <div
                                    key={log.key}
                                    className={cn(
                                      'break-words px-4',
                                      log.level === 'error'
                                        ? 'bg-destructive-300 font-mono text-destructive'
                                        : 'text-foreground-light'
                                    )}
                                  >
                                    [{formatLogTimestamp(log.lastSeen, 'time')}] [
                                    {log.level.toUpperCase()}] [{log.count}x]{' '}
                                    {formatSingleLineMessage(log.message)}
                                  </div>
                                ))
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      </Fragment>
                    ))}
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
