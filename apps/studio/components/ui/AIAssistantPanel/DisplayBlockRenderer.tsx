import React, { useState, useMemo, DragEvent } from 'react'
import { useRouter } from 'next/router'
import { MessagePart } from '@ai-sdk/react' // Assuming this type is needed

import { QueryBlock, DEFAULT_CHART_CONFIG } from '../QueryBlock/QueryBlock'
import { ChartConfig } from 'components/interfaces/SQLEditor/UtilityPanel/ChartConfig'
import { useAiAssistantStateSnapshot } from 'state/ai-assistant-state'
import { findResultForManualId } from './Message.utils' // We'll move the helper here or import
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useFlag } from 'hooks/ui/useFlag'
import { useProfile } from 'lib/profile'
import { useSendEventMutation } from 'data/telemetry/send-event-mutation'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { identifyQueryType } from './AIAssistant.utils'

interface DisplayBlockRendererProps {
  messageId: string
  manualId: string
  initialArgs: {
    // Args specific to this displayBlock invocation
    sql: string
    label?: string
    view?: 'table' | 'chart'
    xAxis?: string
    yAxis?: string
  }
  messageParts: Readonly<MessagePart[]> | undefined
  isLoading: boolean
  onResults: (args: { messageId: string; resultId?: string; results: any[] }) => void
}

export const DisplayBlockRenderer: React.FC<DisplayBlockRendererProps> = ({
  messageId,
  manualId,
  initialArgs,
  messageParts,
  isLoading,
  onResults,
}) => {
  // --- Hooks ---
  const snap = useAiAssistantStateSnapshot()
  const router = useRouter()
  const { profile } = useProfile()
  const { mutate: sendEvent } = useSendEventMutation()
  const supportSQLBlocks = useFlag('reportsV2')
  const canCreateSQLSnippet = useCheckPermissions(PermissionAction.CREATE, 'user_content', {
    resource: { type: 'sql', owner_id: profile?.id },
    subject: { id: profile?.id },
  })

  const [chartConfig, setChartConfig] = useState<ChartConfig>(() => ({
    ...DEFAULT_CHART_CONFIG,
    view: initialArgs.view === 'chart' ? 'chart' : 'table',
    xKey: initialArgs.xAxis ?? '',
    yKey: initialArgs.yAxis ?? '',
  }))

  const isChart = initialArgs.view === 'chart'
  const liveResultData = useMemo(
    () => findResultForManualId(messageParts, manualId),
    [messageParts, manualId]
  )
  const cachedResults = useMemo(
    () => snap.getCachedSQLResults({ messageId, snippetId: manualId }),
    [snap, messageId, manualId]
  )
  const displayData = liveResultData ?? cachedResults
  const isDraggableToReports =
    supportSQLBlocks && canCreateSQLSnippet && router.pathname.endsWith('/reports/[id]')
  const label = initialArgs.label || 'SQL Results'
  const sqlQuery = initialArgs.sql

  // --- Handlers ---
  const handleRunQuery = (queryType: 'select' | 'mutation') => {
    sendEvent({
      action: 'assistant_suggestion_run_query_clicked',
      properties: {
        queryType,
        ...(queryType === 'mutation' ? { category: identifyQueryType(sqlQuery) ?? 'unknown' } : {}),
      },
    })
  }

  const handleUpdateChartConfig = ({
    chartConfig: updatedValues,
  }: {
    chartConfig: Partial<ChartConfig>
  }) => {
    setChartConfig((prev) => ({ ...prev, ...updatedValues }))
  }

  const handleDragStart = (e: DragEvent<Element>) => {
    e.dataTransfer.setData(
      'application/json',
      JSON.stringify({ label, sql: sqlQuery, config: chartConfig })
    )
  }

  return (
    <div className="w-auto -ml-[36px] overflow-x-hidden">
      <QueryBlock
        label={label}
        sql={sqlQuery}
        lockColumns={true}
        showSql={true}
        results={displayData}
        chartConfig={chartConfig}
        isChart={isChart}
        showRunButtonIfNotReadOnly={true}
        isLoading={isLoading}
        draggable={isDraggableToReports}
        onResults={(results) => onResults({ messageId, resultId: manualId, results })}
        onRunQuery={handleRunQuery}
        onUpdateChartConfig={handleUpdateChartConfig}
        onDragStart={handleDragStart}
      />
    </div>
  )
}
