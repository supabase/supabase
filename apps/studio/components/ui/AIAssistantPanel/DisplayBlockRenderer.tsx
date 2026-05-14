import { acceptUntrustedSql, type UntrustedSqlFragment } from '@supabase/pg-meta'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useQueryClient } from '@tanstack/react-query'
import type { ToolUIPart } from 'ai'
import { useParams } from 'common'
import { useRouter } from 'next/router'
import { useRef, useState, type DragEvent, type PropsWithChildren } from 'react'

import { DEFAULT_CHART_CONFIG, QueryBlock } from '../QueryBlock/QueryBlock'
import { identifyQueryType } from './AIAssistant.utils'
import { ConfirmFooter } from './ConfirmFooter'
import { ChartConfig } from '@/components/interfaces/SQLEditor/UtilityPanel/ChartConfig'
import { entityTypeKeys } from '@/data/entity-types/keys'
import { lintKeys } from '@/data/lint/keys'
import { usePrimaryDatabase } from '@/data/read-replicas/replicas-query'
import { useExecuteSqlMutation } from '@/data/sql/execute-sql-mutation'
import { useSendEventMutation } from '@/data/telemetry/send-event-mutation'
import { useChangedSync } from '@/hooks/misc/useChanged'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'
import { useProfile } from '@/lib/profile'

interface DisplayBlockRendererProps {
  messageId: string
  toolCallId: string
  initialArgs: {
    sql: UntrustedSqlFragment
    label?: string
    isWriteQuery?: boolean
    view?: 'table' | 'chart'
    xAxis?: string
    yAxis?: string
  }
  initialResults?: unknown
  /** Called when locally running SQL fails before or during client-side execution. */
  onError?: (args: { messageId: string; errorText: string }) => void
  /** Responds affirmatively to an AI SDK tool approval request; does not run SQL directly. */
  onApprove?: () => void
  /** Responds negatively to an AI SDK tool approval request; does not run SQL directly. */
  onDeny?: () => void
  /** AI SDK tool state used to show approval UI for pending tool calls. */
  toolState?: ToolUIPart['state']
  isLastPart?: boolean
  isLastMessage?: boolean
  showConfirmFooter?: boolean
  onChartConfigChange?: (chartConfig: ChartConfig) => void
  /** Called when the user clicks the query block play button to run SQL locally. */
  onQueryRun?: (queryType: 'select' | 'mutation') => void
}

export const DisplayBlockRenderer = ({
  messageId,
  toolCallId,
  initialArgs,
  initialResults,
  onError,
  onApprove,
  onDeny,
  toolState,
  isLastPart = false,
  isLastMessage = false,
  showConfirmFooter = true,
  onChartConfigChange,
  onQueryRun,
}: PropsWithChildren<DisplayBlockRendererProps>) => {
  const queryClient = useQueryClient()

  const savedInitialArgs = useRef(initialArgs)
  const savedInitialResults = useRef(initialResults)
  const savedInitialConfig = useRef<ChartConfig>({
    ...DEFAULT_CHART_CONFIG,
    view: initialArgs.view === 'chart' ? 'chart' : 'table',
    xKey: initialArgs.xAxis ?? '',
    yKey: initialArgs.yAxis ?? '',
  })

  const router = useRouter()
  const { ref } = useParams()
  const { profile } = useProfile()
  const { data: org } = useSelectedOrganizationQuery()

  const { mutate: sendEvent } = useSendEventMutation()
  const { can: canCreateSQLSnippet } = useAsyncCheckPermissions(
    PermissionAction.CREATE,
    'user_content',
    {
      resource: { type: 'sql', owner_id: profile?.id },
      subject: { id: profile?.id },
    }
  )

  const [chartConfig, setChartConfig] = useState<ChartConfig>(() => ({
    ...DEFAULT_CHART_CONFIG,
    view: initialArgs.view === 'chart' ? 'chart' : 'table',
    xKey: initialArgs.xAxis ?? '',
    yKey: initialArgs.yAxis ?? '',
  }))

  const [rows, setRows] = useState<any[] | undefined>(
    Array.isArray(initialResults) ? initialResults : undefined
  )
  const isReportsPage = router.pathname.endsWith('/reports/[id]')
  const isHomePage = router.pathname === '/project/[ref]'
  const isDraggableToReports = canCreateSQLSnippet && (isReportsPage || isHomePage)
  const label = initialArgs.label || 'SQL Results'
  const [isWriteQuery, setIsWriteQuery] = useState<boolean>(initialArgs.isWriteQuery || false)
  const sqlQuery = initialArgs.sql

  const { database: primaryDatabase } = usePrimaryDatabase({ projectRef: ref })

  const readOnlyConnectionString = primaryDatabase?.connection_string_read_only
  const postgresConnectionString = primaryDatabase?.connectionString

  const {
    mutate: executeSql,
    error: executeSqlError,
    isPending: executeSqlLoading,
  } = useExecuteSqlMutation({
    onError: () => {
      // Suppress toast because error message is displayed inline
    },
  })

  const toolCallIdChanged = useChangedSync(toolCallId)
  if (toolCallIdChanged) {
    setChartConfig(savedInitialConfig.current)
    onChartConfigChange?.(savedInitialConfig.current)
    setIsWriteQuery(savedInitialArgs.current.isWriteQuery || false)
    setRows(Array.isArray(savedInitialResults.current) ? savedInitialResults.current : undefined)
  }

  const initialResultsChanged = useChangedSync(initialResults)
  if (initialResultsChanged) {
    const normalized = Array.isArray(initialResults) ? initialResults : undefined
    if (!normalized || normalized === rows) return
    setRows(normalized)
  }

  const handleRunQuery = (queryType: 'select' | 'mutation') => {
    if (!sqlQuery) return

    onQueryRun?.(queryType)

    sendEvent({
      action: 'assistant_suggestion_run_query_clicked',
      properties: {
        queryType,
        ...(queryType === 'mutation' ? { category: identifyQueryType(sqlQuery) ?? 'unknown' } : {}),
      },
      groups: {
        project: ref ?? 'Unknown',
        organization: org?.slug ?? 'Unknown',
      },
    })
  }

  const runQuery = (queryType: 'select' | 'mutation') => {
    if (!ref || !sqlQuery) return

    const connectionString =
      queryType === 'mutation'
        ? postgresConnectionString
        : (readOnlyConnectionString ?? postgresConnectionString)

    if (!connectionString) {
      const fallbackMessage = 'Unable to find a database connection to execute this query.'
      onError?.({ messageId, errorText: fallbackMessage })
      return
    }

    if (queryType === 'mutation') {
      setIsWriteQuery(true)
    }
    executeSql(
      { projectRef: ref, connectionString, sql: acceptUntrustedSql(sqlQuery) },
      {
        onSuccess: (data) => {
          setRows(Array.isArray(data.result) ? data.result : undefined)
          setIsWriteQuery(queryType === 'mutation' || initialArgs.isWriteQuery || false)
          if (queryType === 'mutation') {
            queryClient.invalidateQueries({ queryKey: lintKeys.lint(ref) })
            queryClient.invalidateQueries({ queryKey: entityTypeKeys.list(ref) })
          }
        },
        onError: (error) => {
          const lowerMessage = error.message.toLowerCase()
          const isReadOnlyError =
            lowerMessage.includes('read-only transaction') ||
            lowerMessage.includes('permission denied') ||
            lowerMessage.includes('must be owner')

          if (queryType === 'select' && isReadOnlyError) {
            setIsWriteQuery(true)
          }

          onError?.({ messageId, errorText: error.message })
        },
      }
    )
  }

  const handleExecute = (queryType: 'select' | 'mutation') => {
    handleRunQuery(queryType)
    runQuery(queryType)
  }

  const handleUpdateChartConfig = ({
    chartConfig: updatedValues,
  }: {
    chartConfig: Partial<ChartConfig>
  }) => {
    setChartConfig((prev) => {
      const next = { ...prev, ...updatedValues }
      onChartConfigChange?.(next)
      return next
    })
  }

  const handleDragStart = (e: DragEvent<Element>) => {
    e.dataTransfer.setData(
      'application/json',
      JSON.stringify({ label, sql: sqlQuery, config: chartConfig })
    )
  }

  const shouldShowConfirmFooter =
    showConfirmFooter &&
    toolState === 'approval-requested' &&
    isLastPart &&
    isLastMessage &&
    !!onApprove &&
    !!onDeny

  return (
    <div className="display-block w-auto overflow-x-hidden">
      <div className="relative z-10">
        <QueryBlock
          label={label}
          isWriteQuery={isWriteQuery}
          sql={sqlQuery}
          results={rows}
          errorText={executeSqlError?.message}
          chartConfig={chartConfig}
          onExecute={handleExecute}
          onUpdateChartConfig={handleUpdateChartConfig}
          draggable={isDraggableToReports}
          onDragStart={handleDragStart}
          disabled={shouldShowConfirmFooter}
          isExecuting={executeSqlLoading}
        />
      </div>
      {shouldShowConfirmFooter && (
        <div className="mx-4">
          <ConfirmFooter
            message="Assistant wants to run this query"
            cancelLabel="Skip"
            confirmLabel={executeSqlLoading ? 'Running...' : 'Run Query'}
            isLoading={executeSqlLoading}
            onCancel={onDeny}
            onConfirm={onApprove}
          />
        </div>
      )}
    </div>
  )
}
