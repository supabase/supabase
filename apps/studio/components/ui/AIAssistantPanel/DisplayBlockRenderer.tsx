import { type UntrustedSqlFragment } from '@supabase/pg-meta'
import type { ToolUIPart } from 'ai'
import { useParams } from 'common'
import { useCallback, useEffect, useMemo, useState } from 'react'

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
  /** AI SDK tool state used to show approval UI for pending tool calls. */
  toolState?: ToolUIPart['state']
  toolApprovalRespondedApproved?: boolean
  /** Hide the results panel while awaiting approval in the composer bar. */
  hideUtilityPanel?: boolean
  onChartConfigChange?: (chartConfig: ChartConfig) => void
  /** Called when the user clicks the query block play button to run SQL locally. */
  onQueryRun?: (queryType: 'select' | 'mutation') => void
}

export const DisplayBlockRenderer = ({
  messageId,
  toolCallId,
  initialArgs,
  initialResults,
  toolState,
  toolApprovalRespondedApproved,
  hideUtilityPanel = false,
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
  const [isSqlEditorVisible, setIsSqlEditorVisible] = useState(hideUtilityPanel)
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
    if (hideUtilityPanel) return

    const rows = getRowsFromToolOutput(initialResults)
    if (rows) snapV2.addResult(blockId, rows)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blockId, hideUtilityPanel, initialResults])

  useEffect(() => {
    if (hideUtilityPanel) {
      setIsSqlEditorVisible(true)
    }
  }, [hideUtilityPanel])

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

  const isApprovalResponded = toolState === 'approval-responded'
  const isApprovalDenied = isApprovalResponded && toolApprovalRespondedApproved === false
  const isRunningApprovedTool = isApprovalResponded && !isApprovalDenied
  const isSqlVisible = hideUtilityPanel || isSqlEditorVisible

  return (
    <div className="display-block w-auto overflow-x-hidden rounded-lg border bg-surface-100">
      <NotebookEditorProvider value={editorContextValue}>
        <SqlQueryBlockEditor
          id={blockId}
          snippetName={label}
          title={label}
          leadingActions={
            <SqlEditorShowSqlToggle
              isSqlEditorVisible={isSqlVisible}
              onToggle={() => setIsSqlEditorVisible((current) => !current)}
            />
          }
          variant="block"
          isSqlEditorVisible={isSqlVisible}
          hideUtilityPanel={hideUtilityPanel}
          autoFocus={false}
          isDisabled={hideUtilityPanel}
          isExecutingOverride={isRunningApprovedTool}
        />
      </NotebookEditorProvider>
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
