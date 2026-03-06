import { PermissionAction } from '@supabase/shared-types/out/constants'
import { IS_PLATFORM, useParams } from 'common'
import { isEqual } from 'lodash'
import { Copy, Eye, EyeOff, Play } from 'lucide-react'
import { Key, ReactNode, useCallback, useEffect, useMemo, useState } from 'react'
import { Item, Menu, useContextMenu } from 'react-contexify'
import DataGrid, { Column, RenderRowProps, Row } from 'react-data-grid'
import { createPortal } from 'react-dom'
import { toast } from 'sonner'
import type { ResponseError } from 'types'
import {
  Button,
  cn,
  copyToClipboard,
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from 'ui'

import AuthColumnRenderer from './LogColumnRenderers/AuthColumnRenderer'
import DatabaseApiColumnRender from './LogColumnRenderers/DatabaseApiColumnRender'
import DatabasePostgresColumnRender from './LogColumnRenderers/DatabasePostgresColumnRender'
import DefaultPreviewColumnRenderer from './LogColumnRenderers/DefaultPreviewColumnRenderer'
import FunctionsEdgeColumnRender from './LogColumnRenderers/FunctionsEdgeColumnRender'
import FunctionsLogsColumnRender from './LogColumnRenderers/FunctionsLogsColumnRender'
import type { LogData, LogQueryError, QueryType } from './Logs.types'
import { isDefaultLogPreviewFormat } from './Logs.utils'
import LogSelection from './LogSelection'
import { DefaultErrorRenderer } from './LogsErrorRenderers/DefaultErrorRenderer'
import ResourcesExceededErrorRenderer from './LogsErrorRenderers/ResourcesExceededErrorRenderer'
import { LogsTableEmptyState } from './LogsTableEmptyState'
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import { DownloadResultsButton } from '@/components/ui/DownloadResultsButton'
import { useSelectedLog } from '@/hooks/analytics/useSelectedLog'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'
import { useProfile } from '@/lib/profile'

// ---------------------------------------------------------------------------
// Pure helpers (outside component so they are tree-shakeable and easy to test)
// ---------------------------------------------------------------------------

/** Moves the timestamp key to the front of the row object for consistent column ordering. */
export function getOrderedFirstRow(firstRow: LogData | undefined): Record<string, unknown> {
  if (!firstRow) return {}
  const { timestamp, ...rest } = firstRow
  if (!timestamp) return firstRow
  return { timestamp, ...rest }
}

/** Formats any cell value for display in the data grid. */
export function formatCellValue(value: unknown): string {
  if (value && typeof value === 'object') return JSON.stringify(value)
  if (value === null) return 'NULL'
  return String(value)
}

/**
 * Returns the column definitions to use for a given query type.
 * Falls back to custom defaultColumns when no queryType is set or no match.
 * Exported for testability.
 */
export function resolveColumns(
  queryType: QueryType | undefined,
  firstRow: LogData | undefined,
  defaultColumns: Column<LogData>[]
): Column<LogData>[] {
  if (!queryType) return defaultColumns

  switch (queryType) {
    case 'api':
      return DatabaseApiColumnRender
    case 'database':
    case 'pg_cron':
      return DatabasePostgresColumnRender
    case 'fn_edge':
      return FunctionsEdgeColumnRender
    case 'functions':
      return FunctionsLogsColumnRender
    case 'auth':
      return AuthColumnRenderer
    default:
      return firstRow && isDefaultLogPreviewFormat(firstRow)
        ? DefaultPreviewColumnRenderer
        : defaultColumns
  }
}

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

/** Handles ArrowUp / ArrowDown keyboard navigation through log rows. */
function useLogKeyboardNavigation(
  logDataRows: LogData[],
  selectedRow: LogData | null,
  onRowClick: (row: LogData) => void
) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!logDataRows.length || !selectedRow) return
      const currentIndex = logDataRows.findIndex((row) => isEqual(row, selectedRow))
      if (currentIndex === -1) return

      if (event.key === 'ArrowUp' && currentIndex > 0) {
        onRowClick(logDataRows[currentIndex - 1])
      } else if (event.key === 'ArrowDown' && currentIndex < logDataRows.length - 1) {
        onRowClick(logDataRows[currentIndex + 1])
      }
    },
    [logDataRows, selectedRow, onRowClick]
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])
}

// ---------------------------------------------------------------------------
// Sub-components (defined outside LogTable to avoid remount on every render)
// ---------------------------------------------------------------------------

interface TableHeaderProps {
  data: LogData[]
  fileRef: string | undefined
  className?: string
  showHeader: boolean
  showHistogramToggle: boolean
  isHistogramShowing?: boolean
  onHistogramToggle?: () => void
  canCreateLogQuery: boolean | null
  onSave?: () => void
  isSaving?: boolean
  hasEditorValue?: boolean
  onRun?: () => void
  isLoading?: boolean
}

const LogsExplorerTableHeader = ({
  data,
  fileRef,
  className,
  showHeader,
  showHistogramToggle,
  isHistogramShowing,
  onHistogramToggle,
  canCreateLogQuery,
  onSave,
  isSaving,
  hasEditorValue,
  onRun,
  isLoading,
}: TableHeaderProps) => (
  <div
    className={cn(
      'flex w-full items-center justify-between border-t bg-surface-100 px-5 py-2',
      className,
      { hidden: !showHeader }
    )}
  >
    <div className="flex items-center gap-2">
      <DownloadResultsButton
        type="text"
        text={`Results ${data && data.length ? `(${data.length})` : ''}`}
        results={data}
        fileName={`supabase-logs-${fileRef}.csv`}
      />
    </div>

    {showHistogramToggle && (
      <div className="flex items-center gap-2">
        <Button
          type="default"
          icon={isHistogramShowing ? <Eye /> : <EyeOff />}
          onClick={onHistogramToggle}
        >
          Histogram
        </Button>
      </div>
    )}

    <div className="space-x-2">
      {IS_PLATFORM && (
        <ButtonTooltip
          type="default"
          onClick={onSave}
          loading={isSaving}
          disabled={!canCreateLogQuery || !hasEditorValue}
          tooltip={{
            content: {
              side: 'bottom',
              text: !canCreateLogQuery
                ? 'You need additional permissions to save your query'
                : undefined,
            },
          }}
        >
          Save query
        </ButtonTooltip>
      )}
      <Button
        title="run-logs-query"
        type={hasEditorValue ? 'primary' : 'alternative'}
        disabled={!hasEditorValue}
        onClick={onRun}
        iconRight={<Play size={12} />}
        loading={isLoading}
      >
        Run
      </Button>
    </div>
  </div>
)

interface LogTableErrorProps {
  error: LogQueryError
  isCustomQuery: boolean
}

const LogTableError = ({ error, isCustomQuery }: LogTableErrorProps) => {
  if (
    typeof error === 'object' &&
    error.error?.errors.find((err) => err.reason === 'resourcesExceeded')
  ) {
    return <ResourcesExceededErrorRenderer error={error} isCustomQuery={isCustomQuery} />
  }

  return (
    <div className="text-foreground flex gap-2 font-mono p-4">
      <DefaultErrorRenderer error={error} isCustomQuery={isCustomQuery} />
    </div>
  )
}

interface Props {
  data?: LogData[]
  onHistogramToggle?: () => void
  isHistogramShowing?: boolean
  isLoading?: boolean
  isSaving?: boolean
  error?: LogQueryError | null
  showDownload?: boolean
  queryType?: QueryType
  projectRef: string
  onRun?: () => void
  onSave?: () => void
  hasEditorValue?: boolean
  className?: string
  EmptyState?: ReactNode
  showHeader?: boolean
  showHistogramToggle?: boolean
  selectedLog?: LogData
  isSelectedLogLoading?: boolean
  selectedLogError?: LogQueryError | ResponseError
  onSelectedLogChange?: (log: LogData | null) => void
}
type LogMap = { [id: string]: LogData }

/**
 * Logs table view with focus side panel
 *
 * When in custom data display mode, the side panel will not open when focusing on logs.
 */
export const LogTable = ({
  data = [],
  queryType,
  onHistogramToggle,
  isHistogramShowing,
  isLoading,
  isSaving,
  error,
  projectRef,
  onRun,
  onSave,
  hasEditorValue,
  className,
  EmptyState,
  showHeader = true,
  showHistogramToggle = true,
  selectedLog,
  isSelectedLogLoading,
  selectedLogError,
  onSelectedLogChange,
}: Props) => {
  const { ref } = useParams()
  const { profile } = useProfile()
  const [selectedLogId] = useSelectedLog()
  const { show: showContextMenu } = useContextMenu()

  const [cellPosition, setCellPosition] = useState<any>()
  const [selectionOpen, setSelectionOpen] = useState(false)
  const [selectedRow, setSelectedRow] = useState<LogData | null>(null)

  const { can: canCreateLogQuery } = useAsyncCheckPermissions(
    PermissionAction.CREATE,
    'user_content',
    {
      resource: { type: 'log_sql', owner_id: profile?.id },
      subject: { id: profile?.id },
    }
  )

  const firstRow = data[0]
  const columnNames = Object.keys(getOrderedFirstRow(firstRow))
  const hasId = columnNames.includes('id')
  const hasTimestamp = columnNames.includes('timestamp')

  const panelContentMinSize = 40
  const panelContentMaxSize = 60

  const LOGS_EXPLORER_CONTEXT_MENU_ID = 'logs-explorer-context-menu'

  const defaultColumns = useMemo<Column<LogData>[]>(
    () =>
      columnNames.map((v: keyof LogData, idx) => ({
        key: `logs-column-${idx}`,
        name: v as string,
        resizable: true,
        renderCell: ({ row }) => (
          <span
            onContextMenu={(e) => {
              e.preventDefault()
              setCellPosition({ row, column: { name: v } })
              showContextMenu(e, { id: LOGS_EXPLORER_CONTEXT_MENU_ID })
            }}
          >
            {formatCellValue(row?.[v])}
          </span>
        ),
        renderHeaderCell: () => <div className="flex items-center">{v}</div>,
        minWidth: 128,
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [columnNames.join(','), setCellPosition, showContextMenu]
  )

  const columns = useMemo(
    () => resolveColumns(queryType, firstRow, defaultColumns),
    [queryType, firstRow, defaultColumns]
  )

  const [dedupedData, logMap] = useMemo<[LogData[], LogMap]>(() => {
    const deduped = [...new Set(data)] as LogData[]

    if (!hasId) {
      return [deduped, {}]
    }

    const map = deduped.reduce((acc: LogMap, d: LogData) => {
      acc[d.id] = d
      return acc
    }, {})

    return [deduped, map]
  }, [data, hasId])

  const logDataRows = useMemo(() => {
    if (hasId && hasTimestamp) {
      return Object.values(logMap).sort((a, b) => b.timestamp - a.timestamp)
    } else {
      return dedupedData
    }
  }, [dedupedData, hasId, hasTimestamp, logMap])

  const RowRenderer = useCallback<(key: Key, props: RenderRowProps<LogData, unknown>) => ReactNode>(
    (key, props) => (
      <Row
        key={key}
        {...props}
        isRowSelected={false}
        selectedCellIdx={undefined}
        onContextMenu={(e: React.MouseEvent) => {
          if (columns.length > 0) {
            setCellPosition({ row: props.row, column: columns[0] })
          }
          showContextMenu(e, { id: LOGS_EXPLORER_CONTEXT_MENU_ID })
        }}
      />
    ),
    [columns, showContextMenu]
  )

  const onCopyCell = () => {
    if (!cellPosition) return
    copyToClipboard(cellPosition.row.event_message, () => {
      toast.success('Copied to clipboard')
    })
  }

  const onRowClick = useCallback(
    (row: LogData) => {
      setSelectedRow(row)
      onSelectedLogChange?.(row)
    },
    [onSelectedLogChange]
  )

  // Keyboard navigation
  useLogKeyboardNavigation(logDataRows, selectedRow, onRowClick)

  useEffect(() => {
    if (selectedLog || isSelectedLogLoading) {
      setSelectionOpen(true)
    }
    if (!isSelectedLogLoading && !selectedLog) {
      setSelectedRow(null)
    }
  }, [selectedLog, isSelectedLogLoading])

  useEffect(() => {
    if (!isLoading && !selectedRow) {
      // [Joshen] Only want to run this once on a fresh session when log param is provided in URL
      // Subsequently, selectedRow state is just controlled by the user's clicks on LogTable
      const logData = data.find((x) => x.id === selectedLogId)
      if (logData) setSelectedRow(logData)
    }
  }, [isLoading])

  if (!data) return null

  return (
    <section className={'h-full flex w-full flex-col flex-1'}>
      {!queryType && (
        <LogsExplorerTableHeader
          data={data}
          fileRef={ref}
          className={className}
          showHeader={showHeader}
          showHistogramToggle={showHistogramToggle}
          isHistogramShowing={isHistogramShowing}
          onHistogramToggle={onHistogramToggle}
          canCreateLogQuery={canCreateLogQuery}
          onSave={onSave}
          isSaving={isSaving}
          hasEditorValue={hasEditorValue}
          onRun={onRun}
          isLoading={isLoading}
        />
      )}
      <ResizablePanelGroup orientation="horizontal">
        <ResizablePanel
          id="log-table-content"
          minSize={`${panelContentMinSize}`}
          maxSize={`${panelContentMaxSize}`}
          defaultSize={`${panelContentMaxSize}`}
        >
          <DataGrid
            role="table"
            style={{ height: '100%' }}
            className={cn('flex-1 flex-grow h-full border-0', {
              'data-grid--simple-logs': queryType,
              'data-grid--logs-explorer': !queryType,
            })}
            rowHeight={40}
            headerRowHeight={queryType ? 0 : 28}
            onSelectedCellChange={(row) => {
              setCellPosition(row)
            }}
            onCellClick={(row) => {
              onRowClick(row.row)
            }}
            columns={columns}
            rowClass={(row: LogData) => {
              return cn(
                'font-mono tracking-tight !bg-studio hover:!bg-surface-100 cursor-pointer',
                {
                  '!bg-surface-200 rdg-row--focused': isEqual(row, selectedRow),
                }
              )
            }}
            rows={logDataRows}
            rowKeyGetter={(r) => {
              if (!hasId) return JSON.stringify(r)
              const row = r as LogData
              return row.id
            }}
            renderers={{
              renderRow: RowRenderer,
              noRowsFallback: !isLoading ? (
                <>
                  {logDataRows.length === 0 && !error && (EmptyState ?? <LogsTableEmptyState />)}
                  {error && (
                    <LogTableError error={error} isCustomQuery={queryType ? false : true} />
                  )}
                </>
              ) : null,
            }}
          />
          {typeof window !== 'undefined' &&
            createPortal(
              <Menu id={LOGS_EXPLORER_CONTEXT_MENU_ID} animation={false}>
                <Item onClick={onCopyCell}>
                  <Copy size={14} />
                  <span className="ml-2 text-xs">Copy event message</span>
                </Item>
              </Menu>,
              document.body
            )}
        </ResizablePanel>

        {selectionOpen && (
          <>
            <ResizableHandle withHandle />
            <ResizablePanel
              id="log-table-panel"
              minSize={`${100 - panelContentMaxSize}`}
              maxSize={`${100 - panelContentMinSize}`}
              defaultSize={`${100 - panelContentMaxSize}`}
            >
              <LogSelection
                isLoading={isSelectedLogLoading || false}
                projectRef={projectRef}
                onClose={() => {
                  onSelectedLogChange?.(null)
                  setSelectionOpen(false)
                }}
                log={selectedLog}
                error={selectedLogError}
                queryType={queryType}
              />
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>
    </section>
  )
}
