import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useParams } from 'common'
import { useRouter } from 'next/router'
import { useRef, useState, type DragEvent, type PropsWithChildren } from 'react'

import { DEFAULT_CHART_CONFIG, QueryBlock } from '../QueryBlock/QueryBlock'
import { identifyQueryType } from './AIAssistant.utils'
import { ConfirmFooter } from './ConfirmFooter'
import { ChartConfig } from '@/components/interfaces/SQLEditor/UtilityPanel/ChartConfig'
import { useSendEventMutation } from '@/data/telemetry/send-event-mutation'
import { useChangedSync } from '@/hooks/misc/useChanged'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'
import { useProfile } from '@/lib/profile'

interface DisplayBlockRendererProps {
  messageId?: string
  toolCallId: string
  initialArgs: {
    sql: string
    label?: string
    isWriteQuery?: boolean
    view?: 'table' | 'chart'
    xAxis?: string
    yAxis?: string
  }
  initialResults?: unknown
  onApprove?: () => void
  onDeny?: () => void
  toolState?:
    | 'input-streaming'
    | 'input-available'
    | 'approval-requested'
    | 'output-available'
    | 'output-error'
  isLastPart?: boolean
  isLastMessage?: boolean
  onChartConfigChange?: (chartConfig: ChartConfig) => void
  onQueryRun?: (queryType: 'select' | 'mutation') => void
}

export const DisplayBlockRenderer = ({
  toolCallId,
  initialArgs,
  initialResults,
  onApprove,
  onDeny,
  toolState,
  isLastPart = false,
  isLastMessage = false,
  onChartConfigChange,
  onQueryRun,
}: PropsWithChildren<DisplayBlockRendererProps>) => {
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
  const isWriteQuery = initialArgs.isWriteQuery || false
  const sqlQuery = initialArgs.sql

  const toolCallIdChanged = useChangedSync(toolCallId)
  if (toolCallIdChanged) {
    setChartConfig(savedInitialConfig.current)
    onChartConfigChange?.(savedInitialConfig.current)
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

  const shouldShowConfirmFooter = toolState === 'approval-requested' && isLastPart && isLastMessage

  return (
    <div className="display-block w-auto overflow-x-hidden">
      <div className="relative z-10">
        <QueryBlock
          label={label}
          isWriteQuery={isWriteQuery}
          sql={sqlQuery}
          results={rows}
          chartConfig={chartConfig}
          onExecute={handleRunQuery}
          onUpdateChartConfig={handleUpdateChartConfig}
          draggable={isDraggableToReports}
          onDragStart={handleDragStart}
          disabled={shouldShowConfirmFooter}
        />
      </div>
      {shouldShowConfirmFooter && (
        <div className="mx-4">
          <ConfirmFooter
            message="Assistant wants to run this query"
            cancelLabel="Skip"
            confirmLabel="Run Query"
            onCancel={() => onDeny?.()}
            onConfirm={() => {
              handleRunQuery(isWriteQuery ? 'mutation' : 'select')
              onApprove?.()
            }}
          />
        </div>
      )}
    </div>
  )
}
