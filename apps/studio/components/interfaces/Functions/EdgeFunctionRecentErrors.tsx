import { LOGS_TABLES } from 'components/interfaces/Settings/Logs/Logs.constants'
import {
  genDefaultQuery,
  isUnixMicro,
  unixMicroToIsoTimestamp,
} from 'components/interfaces/Settings/Logs/Logs.utils'
import { SIDEBAR_KEYS } from 'components/layouts/ProjectLayout/LayoutSidebar/LayoutSidebarProvider'
import { AiAssistantDropdown } from 'components/ui/AiAssistantDropdown'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import useLogsQuery from 'hooks/analytics/useLogsQuery'
import { ExternalLink } from 'lucide-react'
import { useRouter } from 'next/router'
import { Fragment, useMemo } from 'react'
import { useAiAssistantStateSnapshot } from 'state/ai-assistant-state'
import { useSidebarManagerSnapshot } from 'state/sidebar-manager-state'
import {
  Badge,
  Button,
  Card,
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
  PageSectionContent,
  PageSectionMeta,
  PageSectionSummary,
  PageSectionTitle,
} from 'ui-patterns/PageSection'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import { parseEdgeFunctionEventMessage } from './EdgeFunctionRecentInvocations.utils'

dayjs.extend(relativeTime)

type GroupedRuntimeLog = {
  key: string
  message: string
  level: string
  count: number
  lastSeen: number
}

type RecentErrorGroup = {
  message: string
  count: number
  lastSeen: number
  lastExecutionId?: string
  lastStatusCode?: string
  lastMethod?: string
  executionTime?: string
  executionIds: string[]
  logs: GroupedRuntimeLog[]
}

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
    () =>
      genDefaultQuery(
        LOGS_TABLES.fn_edge,
        {
          function_id: functionId ?? '__pending__',
          'status_code.error': true,
        },
        200
      ),
    [functionId]
  )
  const functionRuntimeLogsSql = useMemo(
    () =>
      genDefaultQuery(
        LOGS_TABLES.functions,
        { 'metadata.function_id': functionId ?? '__pending__' },
        500
      ),
    [functionId]
  )

  const { logData: recentErrorInvocations, isLoading: isLoadingRecentErrorInvocations } =
    useLogsQuery(
      projectRef as string,
      {
        sql: recentErrorInvocationsSql,
        iso_timestamp_start: isoTimestampStart,
        iso_timestamp_end: isoTimestampEnd,
      },
      isQueryEnabled
    )

  const { logData: functionRuntimeLogs, isLoading: isLoadingFunctionRuntimeLogs } = useLogsQuery(
    projectRef as string,
    {
      sql: functionRuntimeLogsSql,
      iso_timestamp_start: isoTimestampStart,
      iso_timestamp_end: isoTimestampEnd,
    },
    isQueryEnabled
  )

  const recentErrorGroups = useMemo<RecentErrorGroup[]>(() => {
    const runtimeLogsByExecutionId = functionRuntimeLogs.reduce<
      Record<string, typeof functionRuntimeLogs>
    >((acc, log) => {
      const executionId = String(log.execution_id ?? '')
      if (!executionId) return acc

      acc[executionId] = [...(acc[executionId] ?? []), log]
      return acc
    }, {})

    const grouped = recentErrorInvocations.reduce<
      Record<
        string,
        {
          message: string
          count: number
          lastSeen: number
          lastExecutionId?: string
          lastStatusCode?: string
          lastMethod?: string
          executionTime?: string
          executionIds: string[]
        }
      >
    >((acc, item) => {
      const statusCode = String(item.status_code ?? '')
      const method = String(item.method ?? '')
      const message =
        parseEdgeFunctionEventMessage(
          String(item.event_message ?? ''),
          method || undefined,
          statusCode
        ) || 'Unknown error'
      const executionId = String(item.execution_id ?? '')
      const timestamp = Number(item.timestamp ?? 0)
      const current = acc[message]

      if (!current) {
        acc[message] = {
          message,
          count: 1,
          lastSeen: timestamp,
          lastExecutionId: executionId || undefined,
          lastStatusCode: statusCode || undefined,
          lastMethod: method || undefined,
          executionTime:
            item.execution_time_ms !== undefined
              ? `${Math.round(Number(item.execution_time_ms))}ms`
              : undefined,
          executionIds: executionId ? [executionId] : [],
        }
        return acc
      }

      current.count += 1
      if (executionId && !current.executionIds.includes(executionId)) {
        current.executionIds.push(executionId)
      }

      if (timestamp > current.lastSeen) {
        current.lastSeen = timestamp
        current.lastExecutionId = executionId || undefined
        current.lastStatusCode = statusCode || undefined
        current.lastMethod = method || undefined
        current.executionTime =
          item.execution_time_ms !== undefined
            ? `${Math.round(Number(item.execution_time_ms))}ms`
            : undefined
      }

      return acc
    }, {})

    return Object.values(grouped)
      .sort((a, b) => b.lastSeen - a.lastSeen)
      .slice(0, 5)
      .map((group) => ({
        ...group,
        logs: group.executionIds
          .flatMap((executionId) => runtimeLogsByExecutionId[executionId] ?? [])
          .reduce<GroupedRuntimeLog[]>((acc, log) => {
            const level = String(log.level ?? log.event_type ?? 'log')
            const message = String(log.event_message ?? '')
            const key = `${level}:${message}`
            const timestamp = Number(log.timestamp ?? 0)
            const existing = acc.find((entry) => entry.key === key)

            if (existing) {
              existing.count += 1
              existing.lastSeen = Math.max(existing.lastSeen, timestamp)
              return acc
            }

            acc.push({ key, message, level, count: 1, lastSeen: timestamp })
            return acc
          }, [])
          .sort((a, b) => b.count - a.count || b.lastSeen - a.lastSeen)
          .slice(0, 5),
      }))
  }, [functionRuntimeLogs, recentErrorInvocations])

  const formatLogTimestamp = (value: string | number | undefined, format: 'relative' | 'time') => {
    if (value === undefined) return '-'

    const timestamp = isUnixMicro(value) ? unixMicroToIsoTimestamp(value) : String(value)
    return format === 'relative'
      ? dayjs.utc(timestamp).fromNow()
      : dayjs.utc(timestamp).format('HH:mm:ss')
  }

  const buildGroupMarkdown = (group: RecentErrorGroup) => {
    const lines = [
      `## Recent error for \`${functionSlug ?? 'edge function'}\``,
      '',
      `### ${group.message}`,
      `- Occurrences: ${group.count}`,
      `- Last seen: ${formatLogTimestamp(group.lastSeen, 'relative')}`,
    ]

    if (group.lastMethod) lines.push(`- Last method: ${group.lastMethod}`)
    if (group.lastStatusCode) lines.push(`- Last status: ${group.lastStatusCode}`)
    if (group.executionTime) lines.push(`- Last execution time: ${group.executionTime}`)

    lines.push('', '#### Related runtime logs')

    if (group.logs.length === 0) {
      lines.push('- No related runtime logs found for this error group.')
    } else {
      group.logs.forEach((log) => {
        lines.push(
          `- [${log.level}] ${log.count} occurrence${
            log.count === 1 ? '' : 's'
          }, last seen ${formatLogTimestamp(log.lastSeen, 'relative')}: ${log.message}`
        )
      })
    }

    return lines.join('\n')
  }

  const buildGroupAssistantPrompt = (group: RecentErrorGroup) => {
    return [
      `Analyze this recurring edge function error for \`${functionSlug ?? 'edge function'}\`.`,
      'Summarize the likely root cause, what the runtime logs suggest, and the next debugging steps.',
      '',
      buildGroupMarkdown(group),
    ].join('\n')
  }

  const handleOpenAssistant = (group: RecentErrorGroup) => {
    openSidebar(SIDEBAR_KEYS.AI_ASSISTANT)
    aiAssistant.newChat({
      name: `Investigate ${functionSlug ?? 'error'}`,
      initialMessage: buildGroupAssistantPrompt(group),
    })
  }

  const buildGroupTerminalText = (group: RecentErrorGroup) => {
    if (group.logs.length === 0) {
      return 'No related runtime logs found for this error group.'
    }

    return group.logs
      .map((log) => {
        const singleLineMessage = log.message.replace(/\s*[\r\n]+\s*/g, ' ').trim()
        return `[${formatLogTimestamp(log.lastSeen, 'time')}] [${log.level.toUpperCase()}] [${log.count}x] ${singleLineMessage}`
      })
      .join('\n')
  }

  const getStatusBadgeVariant = (statusCode?: string) => {
    if (!statusCode) return 'destructive' as const

    const status = Number(statusCode)
    if (Number.isNaN(status)) return 'destructive' as const
    if (status >= 500) return 'destructive' as const

    return 'default' as const
  }

  return (
    <PageSection>
      <PageSectionContent>
        <PageContainer size="full">
          <div className="flex flex-col gap-6">
            <PageSectionMeta>
              <PageSectionSummary>
                <PageSectionTitle>Recent Errors</PageSectionTitle>
              </PageSectionSummary>
            </PageSectionMeta>

            {isLoadingRecentErrorInvocations || isLoadingFunctionRuntimeLogs ? (
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
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentErrorGroups.map((group) => (
                      <Fragment key={group.message}>
                        <TableRow key={`${group.message}-summary`}>
                          <TableCell className="max-w-[420px]">
                            <span className="block break-words text-foreground">
                              {group.message}
                            </span>
                          </TableCell>
                          <TableCell className="font-mono text-xs text-foreground-light">
                            {group.count}
                          </TableCell>
                          <TableCell className="text-foreground-light">
                            {formatLogTimestamp(group.lastSeen, 'relative')}
                          </TableCell>
                          <TableCell className="font-mono text-xs text-foreground-light">
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
                          <TableCell className="font-mono text-xs text-foreground-light">
                            {group.executionTime ?? '-'}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <AiAssistantDropdown
                                label="Ask Assistant"
                                size="tiny"
                                buildPrompt={() => buildGroupAssistantPrompt(group)}
                                onOpenAssistant={() => handleOpenAssistant(group)}
                              />
                              <Button
                                type="default"
                                size="tiny"
                                icon={<ExternalLink size={14} />}
                                onClick={() =>
                                  router.push(
                                    `/project/${projectRef}/functions/${functionSlug}/logs`
                                  )
                                }
                              >
                                Open logs
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                        <TableRow key={`${group.message}-logs`} className="bg-surface-100/30">
                          <TableCell colSpan={7} className="p-0">
                            <pre className="max-h-64 overflow-auto bg-surface-75 px-4 py-3 text-xs leading-4 font-mono whitespace-pre-line break-words text-foreground-light">
                              {buildGroupTerminalText(group)}
                            </pre>
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
