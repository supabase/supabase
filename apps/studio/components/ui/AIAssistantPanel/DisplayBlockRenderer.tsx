import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useRouter } from 'next/router'
import { DragEvent, PropsWithChildren, useEffect, useState } from 'react'

import { useParams } from 'common'
import { ChartConfig } from 'components/interfaces/SQLEditor/UtilityPanel/ChartConfig'
import { useSendEventMutation } from 'data/telemetry/send-event-mutation'
import { useAsyncCheckProjectPermissions } from 'hooks/misc/useCheckPermissions'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { useProfile } from 'lib/profile'

import { ConfirmFooter } from './ConfirmFooter'
import { DEFAULT_CHART_CONFIG, QueryBlock } from '../QueryBlock/QueryBlock'
import { identifyQueryType } from './AIAssistant.utils'
import { usePrimaryDatabase } from 'data/read-replicas/replicas-query'
import { useExecuteSqlMutation } from 'data/sql/execute-sql-mutation'

interface DisplayBlockRendererProps {
  messageId: string
  toolCallId: string
  initialArgs: {
    sql: string
    label?: string
    isWriteQuery?: boolean
    view?: 'table' | 'chart'
    xAxis?: string
    yAxis?: string
  }
  results?: unknown
  onResults: (args: { messageId: string; resultId?: string; results: unknown }) => void
  onError?: (args: { messageId: string; resultId?: string; errorText: string }) => void
  toolState?: 'input-streaming' | 'input-available' | 'output-available' | 'output-error'
  isLastPart?: boolean
  isLastMessage?: boolean
}

export const DisplayBlockRenderer = ({
  messageId,
  toolCallId,
  initialArgs,
  results,
  onResults,
  onError,
  toolState,
  isLastPart = false,
  isLastMessage = false,
}: PropsWithChildren<DisplayBlockRendererProps>) => {
  const router = useRouter()
  const { ref } = useParams()
  const { profile } = useProfile()
  const { data: org } = useSelectedOrganizationQuery()

  const { mutate: sendEvent } = useSendEventMutation()
  const { can: canCreateSQLSnippet } = useAsyncCheckProjectPermissions(
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

  const resultId = toolCallId
  const displayData = Array.isArray(results) ? results : undefined
  const isDraggableToReports = canCreateSQLSnippet && router.pathname.endsWith('/reports/[id]')
  const label = initialArgs.label || 'SQL Results'
  const isWriteQuery = initialArgs.isWriteQuery || false
  const sqlQuery = initialArgs.sql
  const [isRunning, setIsRunning] = useState(false)

  const { database: primaryDatabase } = usePrimaryDatabase({ projectRef: ref })
  const readOnlyConnectionString = primaryDatabase?.connection_string_read_only
  const postgresConnectionString = primaryDatabase?.connectionString

  const { mutate: execute } = useExecuteSqlMutation({
    onSuccess: (data) => {
      onResults({ messageId, resultId, results: data.result })
      setIsRunning(false)
    },
    onError: (error) => {
      onError?.({ messageId, resultId, errorText: error.message })
      setIsRunning(false)
    },
  })

  const handleRunQuery = (queryType: 'select' | 'mutation') => {
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

  const handleExecute = (queryType: 'select' | 'mutation') => {
    handleRunQuery(queryType)
    if (ref && postgresConnectionString) {
      setIsRunning(true)
      execute({ projectRef: ref, connectionString: postgresConnectionString, sql: sqlQuery })
    }
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

  const resolvedHasDecision = !!results
  const shouldShowConfirmFooter =
    !resolvedHasDecision && toolState === 'input-available' && isLastPart && isLastMessage

  return (
    <div className="display-block w-auto overflow-x-hidden">
      <QueryBlock
        label={label}
        isWriteQuery={isWriteQuery}
        sql={sqlQuery}
        initialResults={displayData}
        chartConfig={chartConfig}
        onResults={(results) => {
          onResults({ messageId, resultId, results })
          setIsRunning(false)
        }}
        onRunQuery={handleRunQuery}
        onUpdateChartConfig={handleUpdateChartConfig}
        onError={(errorText) => {
          onError?.({ messageId, resultId, errorText })
          setIsRunning(false)
        }}
        draggable={isDraggableToReports}
        onDragStart={handleDragStart}
        disabled={!resolvedHasDecision || isRunning}
        isExternallyExecuting={isRunning}
      />

      {shouldShowConfirmFooter && (
        <div className="mx-4">
          <ConfirmFooter
            message="Assistant wants to run this query"
            cancelLabel="Skip"
            confirmLabel={isRunning ? 'Running…' : 'Run Query'}
            isLoading={isRunning}
            onCancel={async () => {
              setIsRunning(false)
              onResults({ messageId, resultId, results: 'User skipped running the query' })
            }}
            onConfirm={() => {
              handleExecute(isWriteQuery ? 'mutation' : 'select')
            }}
          />
        </div>
      )}
    </div>
  )
}
