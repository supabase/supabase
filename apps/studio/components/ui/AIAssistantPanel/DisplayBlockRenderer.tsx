import { type UntrustedSqlFragment } from '@supabase/pg-meta'
import type { ToolUIPart } from 'ai'
import { useParams } from 'common'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { cn } from 'ui'

import { ConfirmFooter } from './ConfirmFooter'
import { getLogDatePickerValueForHelper } from '@/components/interfaces/Settings/Logs/logsDateRange'
import { createSqlSnippetSkeletonV2 } from '@/components/interfaces/SQLEditor/SQLEditor.utils'
import { SqlEditorShowSqlToggle } from '@/components/interfaces/SQLEditor/SqlEditorShowSqlToggle'
import { SqlQueryBlockEditor } from '@/components/interfaces/SQLEditor/SqlQueryBlockEditor'
import { ChartConfig } from '@/components/interfaces/SQLEditor/UtilityPanel/ChartConfig'
import { DEFAULT_CHART_CONFIG } from '@/components/ui/QueryBlock/QueryBlock'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { useProfile } from '@/lib/profile'
import {
  registerNotebookBlock,
  unregisterNotebookBlock,
  type NotebookBlockPersistPatch,
} from '@/state/notebook-block-registry'
import { NotebookEditorProvider } from '@/state/notebook-editor-context'
import { useSqlEditorV2StateSnapshot } from '@/state/sql-editor-v2'

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
  toolApprovalRespondedApproved?: boolean
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
  onApprove,
  onDeny,
  toolState,
  toolApprovalRespondedApproved,
  isLastPart = false,
  isLastMessage = false,
  showConfirmFooter = true,
  onChartConfigChange,
}: DisplayBlockRendererProps) => {
  const { ref } = useParams()
  const { profile } = useProfile()
  const { data: project } = useSelectedProjectQuery()
  const snapV2 = useSqlEditorV2StateSnapshot()

  const blockId = useMemo(
    () => `assistant-sql-${messageId}-${toolCallId}`.replace(/[^a-zA-Z0-9_-]/g, '-'),
    [messageId, toolCallId]
  )

  const label = initialArgs.label || 'SQL Results'
  const sqlQuery = String(initialArgs.sql ?? '')
  const initialChartConfig = useMemo<ChartConfig>(
    () => ({
      ...DEFAULT_CHART_CONFIG,
      view: initialArgs.view === 'chart' ? 'chart' : 'table',
      xKey: initialArgs.xAxis ?? '',
      yKey: initialArgs.yAxis ?? '',
    }),
    [initialArgs.view, initialArgs.xAxis, initialArgs.yAxis]
  )

  const [chartConfig, setChartConfig] = useState<ChartConfig>(() => initialChartConfig)
  const [isSqlEditorVisible, setIsSqlEditorVisible] = useState(false)
  const [querySource, setQuerySource] = useState<'database' | 'logs'>('database')
  const [logsDatePickerValue, setLogsDatePickerValue] = useState(() =>
    getLogDatePickerValueForHelper()
  )

  const handlePersistBlock = useCallback((patch: NotebookBlockPersistPatch) => {
    if (patch.querySource) setQuerySource(patch.querySource)
    if (patch.logsDatePickerValue) setLogsDatePickerValue(patch.logsDatePickerValue)
  }, [])

  useEffect(() => {
    registerNotebookBlock(blockId, { persistBlock: handlePersistBlock })

    return () => {
      unregisterNotebookBlock(blockId)
      snapV2.removeSnippet(blockId, true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blockId, handlePersistBlock])

  useEffect(() => {
    setChartConfig(initialChartConfig)
    onChartConfigChange?.(initialChartConfig)
    setQuerySource('database')
    setLogsDatePickerValue(getLogDatePickerValueForHelper())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blockId, initialChartConfig])

  useEffect(() => {
    const snippet = createSqlSnippetSkeletonV2({
      idOverride: blockId,
      name: label,
      sql: sqlQuery,
      owner_id: profile?.id ?? -1,
      project_id: project?.id ?? 0,
    })

    snapV2.setSnippet((ref as string | undefined) ?? '', snippet)
    snapV2.setSql({ id: blockId, sql: sqlQuery })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blockId, label, profile?.id, project?.id, ref, sqlQuery])

  useEffect(() => {
    const rows = getRowsFromToolOutput(initialResults)
    if (rows) snapV2.addResult(blockId, rows)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blockId, initialResults])

  const handleChartConfigChange = useCallback(
    (config: ChartConfig) => {
      setChartConfig(config)
      onChartConfigChange?.(config)
    },
    [onChartConfigChange]
  )

  const editorContextValue = useMemo(
    () => ({
      notebookId: messageId,
      blockId,
      chartConfig,
      onChartConfigChange: handleChartConfigChange,
      persistBlock: handlePersistBlock,
      querySource,
      logsDatePickerValue,
    }),
    [
      messageId,
      blockId,
      chartConfig,
      handleChartConfigChange,
      handlePersistBlock,
      querySource,
      logsDatePickerValue,
    ]
  )

  const isApprovalRequested = toolState === 'approval-requested'
  const isApprovalResponded = toolState === 'approval-responded'
  const isApprovalDenied = isApprovalResponded && toolApprovalRespondedApproved === false
  const shouldShowConfirmFooter =
    showConfirmFooter &&
    (isApprovalRequested || (isApprovalResponded && !isApprovalDenied)) &&
    isLastPart &&
    isLastMessage &&
    (isApprovalResponded || (!!onApprove && !!onDeny))
  const isRunningApprovedTool = isApprovalResponded && !isApprovalDenied

  return (
    <div className="display-block w-auto">
      <div
        className={cn(
          'overflow-x-hidden border bg-surface-100',
          shouldShowConfirmFooter ? 'rounded-t-lg' : 'rounded-lg'
        )}
      >
        <NotebookEditorProvider value={editorContextValue}>
          <SqlQueryBlockEditor
            id={blockId}
            snippetName={label}
            title={label}
            leadingActions={
              <SqlEditorShowSqlToggle
                isSqlEditorVisible={isSqlEditorVisible}
                onToggle={() => setIsSqlEditorVisible((current) => !current)}
              />
            }
            variant="block"
            isSqlEditorVisible={isSqlEditorVisible}
            autoFocus={false}
            isDisabled={shouldShowConfirmFooter}
            isExecutingOverride={isRunningApprovedTool}
          />
        </NotebookEditorProvider>
      </div>
      {shouldShowConfirmFooter && (
        <div className="relative z-10 -mt-px mx-3">
          <ConfirmFooter
            placement="overhang"
            message="Assistant wants to run this query"
            cancelLabel="Skip"
            confirmLabel="Run Query"
            confirmLabelLoading="Running..."
            isLoading={isApprovalResponded}
            onCancel={isApprovalRequested ? onDeny : undefined}
            onConfirm={isApprovalRequested ? onApprove : undefined}
          />
        </div>
      )}
    </div>
  )
}

type QueryResultRow = Record<string, unknown>

function isQueryResultRows(value: unknown): value is QueryResultRow[] {
  return Array.isArray(value)
}

function getRowsFromToolOutput(output: unknown): QueryResultRow[] | undefined {
  if (isQueryResultRows(output)) return output

  if (!output || typeof output !== 'object') return undefined

  if ('result' in output && isQueryResultRows(output.result)) {
    return output.result
  }

  if ('rows' in output && isQueryResultRows(output.rows)) {
    return output.rows
  }

  return undefined
}
