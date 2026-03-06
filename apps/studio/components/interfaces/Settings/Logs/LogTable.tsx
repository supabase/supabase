import { PermissionAction } from '@supabase/shared-types/out/constants'
import { IS_PLATFORM, useParams } from 'common'
import { isEqual } from 'lodash'
import { Copy, Eye, EyeOff, Play, X as XIcon } from 'lucide-react'
import { Key, ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Item, Menu, useContextMenu } from 'react-contexify'
import DataGrid, { Column, RenderRowProps, Row } from 'react-data-grid'
import { createPortal } from 'react-dom'
import { toast } from 'sonner'
import type { ResponseError } from 'types'
import {
  Button,
  Checkbox_Shadcn_,
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
import { formatLogsAsJson, formatLogsAsMarkdown, isDefaultLogPreviewFormat } from './Logs.utils'
import LogSelection from './LogSelection'
import { DefaultErrorRenderer } from './LogsErrorRenderers/DefaultErrorRenderer'
import ResourcesExceededErrorRenderer from './LogsErrorRenderers/ResourcesExceededErrorRenderer'
import { LogsTableEmptyState } from './LogsTableEmptyState'
import { MultiSelectActionBar } from './MultiSelectActionBar'
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import { DownloadResultsButton } from '@/components/ui/DownloadResultsButton'
import { useSelectedLog } from '@/hooks/analytics/useSelectedLog'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'
import { useProfile } from '@/lib/profile'

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
  sqlQuery?: string
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
  sqlQuery,
}: Props) => {
  const { ref } = useParams()
  const { profile } = useProfile()
  const [selectedLogId] = useSelectedLog()
  const { show: showContextMenu } = useContextMenu()

  const [cellPosition, setCellPosition] = useState<any>()
  const [selectedRow, setSelectedRow] = useState<LogData | null>(null)
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set())
  const [anchorRowId, setAnchorRowId] = useState<string | null>(null)
  const [copiedFormat, setCopiedFormat] = useState<'json' | 'markdown' | null>(null)

  const { can: canCreateLogQuery } = useAsyncCheckPermissions(
    PermissionAction.CREATE,
    'user_content',
    {
      resource: { type: 'log_sql', owner_id: profile?.id },
      subject: { id: profile?.id },
    }
  )

  const firstRow = data[0]

  function getFirstRow() {
    if (!firstRow) return {}
    const { timestamp, ...rest } = firstRow
    if (!timestamp) return firstRow
    return { timestamp, ...rest }
  }

  const columnNames = Object.keys(getFirstRow() || {})
  const hasId = columnNames.includes('id')
  const hasTimestamp = columnNames.includes('timestamp')

  const panelContentMinSize = 40
  const panelContentMaxSize = 60

  const LOGS_EXPLORER_CONTEXT_MENU_ID = 'logs-explorer-context-menu'

  const getRowKey = useCallback(
    (row: LogData): string => {
      if (!hasId) return JSON.stringify(row)
      return (row as LogData).id
    },
    [hasId]
  )

  const [dedupedData, logMap] = useMemo<[LogData[], LogMap]>(() => {
    const deduped = [...new Set(data)] as LogData[]
    if (!hasId) return [deduped, {}]
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

  // Side panel is open only when a single row is selected via regular click (not multi-select)
  const selectionOpen = Boolean((selectedLog || isSelectedLogLoading) && selectedRows.size === 0)

  const selectedRowsData = useMemo(
    () => logDataRows.filter((r) => selectedRows.has(getRowKey(r))),
    [logDataRows, selectedRows, getRowKey]
  )

  const checkboxColumn: Column<LogData> = {
    key: 'multi-select',
    name: '',
    width: 32,
    maxWidth: 32,
    minWidth: 32,
    renderCell: ({ row }) => {
      const key = getRowKey(row)
      const toggle = () => {
        const next = new Set(selectedRows)
        if (next.has(key)) {
          next.delete(key)
        } else {
          next.add(key)
        }
        setSelectedRows(next)
        setAnchorRowId(key)
        if (next.size > 0) {
          setSelectedRow(null)
          onSelectedLogChange?.(null)
        }
      }
      return (
        <div
          className="absolute group inset-0 flex justify-center px-2 items-center cursor-pointer"
          onClick={(e) => {
            e.stopPropagation()
            toggle()
          }}
        >
          <Checkbox_Shadcn_
            className="group-hover:border-foreground-muted"
            checked={selectedRows.has(key)}
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
            onCheckedChange={toggle}
          />
        </div>
      )
    },
  }

  const DEFAULT_COLUMNS = columnNames.map((v: keyof LogData, idx) => {
    const column = `logs-column-${idx}`
    const result: Column<LogData> = {
      key: column,
      name: v as string,
      resizable: true,
      renderCell: ({ row }) => {
        return (
          <span
            onContextMenu={(e) => {
              e.preventDefault()
              setCellPosition({ row, column: { name: v } })
              showContextMenu(e, { id: LOGS_EXPLORER_CONTEXT_MENU_ID })
            }}
          >
            {formatCellValue(row?.[v])}
          </span>
        )
      },
      renderHeaderCell: () => {
        return <div className="flex items-center">{v}</div>
      },
      minWidth: 128,
    }
    return result
  })

  let columns = DEFAULT_COLUMNS

  if (!queryType) {
    columns
  } else {
    switch (queryType) {
      case 'api':
        columns = DatabaseApiColumnRender
        break
      case 'database':
        columns = DatabasePostgresColumnRender
        break
      case 'fn_edge':
        columns = FunctionsEdgeColumnRender
        break
      case 'functions':
        columns = FunctionsLogsColumnRender
        break
      case 'auth':
        columns = AuthColumnRenderer
        break
      case 'pg_cron':
        columns = DatabasePostgresColumnRender
        break
      default:
        if (firstRow && isDefaultLogPreviewFormat(firstRow)) {
          columns = DefaultPreviewColumnRenderer
        } else {
          columns = DEFAULT_COLUMNS
        }
        break
    }
  }

  if (columns.length > 0) {
    columns = [checkboxColumn, ...columns]
  }

  const RowRenderer = useCallback<(key: Key, props: RenderRowProps<LogData, unknown>) => ReactNode>(
    (key, props) => {
      const handleContextMenu = (e: React.MouseEvent) => {
        const firstDataColumn = columns.find((c) => c.key !== 'multi-select')
        if (firstDataColumn) {
          setCellPosition({ row: props.row, column: firstDataColumn })
        }
        showContextMenu(e, { id: LOGS_EXPLORER_CONTEXT_MENU_ID })
      }
      const handleClick = (e: React.MouseEvent) => {
        // Check if clicking on the checkbox column - let that handler handle it
        const target = e.target as HTMLElement
        if (target.closest('[data-column-key="multi-select"]')) return
        onRowClick(props.row)
      }
      return (
        <Row
          key={key}
          {...props}
          isRowSelected={false}
          selectedCellIdx={undefined}
          onContextMenu={handleContextMenu}
          onClick={handleClick}
        />
      )
    },
    [columns, showContextMenu]
  )

  const formatCellValue = (value: any) => {
    return value && typeof value === 'object'
      ? JSON.stringify(value)
      : value === null
        ? 'NULL'
        : String(value)
  }

  const onCopyCell = () => {
    if (!cellPosition) return
    const eventMessage = cellPosition.row.event_message
    copyToClipboard(eventMessage, () => {
      toast.success('Copied to clipboard')
    })
  }

  function onRowClick(row: LogData) {
    const key = getRowKey(row)

    // Regular single click — clear multi-select, open side panel
    setSelectedRows(new Set())
    setAnchorRowId(key)
    setSelectedRow(row)
    onSelectedLogChange?.(row)
  }

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSelectedRows(new Set())
        setAnchorRowId(null)
        return
      }

      // Arrow navigation only in single-select mode
      if (!logDataRows.length || !selectedRow || selectedRows.size > 0) return

      const currentIndex = logDataRows.findIndex((row) => isEqual(row, selectedRow))
      if (currentIndex === -1) return

      if (event.key === 'ArrowUp' && currentIndex > 0) {
        const prevRow = logDataRows[currentIndex - 1]
        onRowClick(prevRow)
      } else if (event.key === 'ArrowDown' && currentIndex < logDataRows.length - 1) {
        const nextRow = logDataRows[currentIndex + 1]
        onRowClick(nextRow)
      }
    },
    [logDataRows, selectedRow, selectedRows, onRowClick]
  )

  useEffect(() => {
    if (!isSelectedLogLoading && !selectedLog) {
      setSelectedRow(null)
    }
  }, [selectedLog, isSelectedLogLoading])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleKeyDown])

  useEffect(() => {
    if (!isLoading && !selectedRow) {
      const logData = data.find((x) => x.id === selectedLogId)
      if (logData) setSelectedRow(logData)
    }
  }, [isLoading, data, selectedRow, selectedLogId])

  // Clear multi-select when a new query starts loading
  useEffect(() => {
    if (isLoading) {
      setSelectedRows(new Set())
      setAnchorRowId(null)
    }
  }, [isLoading])

  // Copy feedback timeout
  useEffect(() => {
    if (!copiedFormat) return
    const timer = setTimeout(() => setCopiedFormat(null), 2000)
    return () => clearTimeout(timer)
  }, [copiedFormat])

  function handleCopySelectedRows(format: 'json' | 'markdown') {
    const text =
      format === 'json'
        ? formatLogsAsJson(selectedRowsData)
        : formatLogsAsMarkdown(selectedRowsData)
    copyToClipboard(text, () => {
      setCopiedFormat(format)
      toast.success(
        `Copied ${selectedRowsData.length} log${selectedRowsData.length !== 1 ? 's' : ''} as ${format.toUpperCase()}`
      )
    })
  }

  const LogsExplorerTableHeader = () => (
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
          fileName={`supabase-logs-${ref}.csv`}
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

  const RenderErrorAlert = () => {
    if (!error) return null
    const childProps = {
      isCustomQuery: queryType ? false : true,
      error: error!,
    }
    if (
      typeof error === 'object' &&
      error.error?.errors.find((err) => err.reason === 'resourcesExceeded')
    ) {
      return <ResourcesExceededErrorRenderer {...childProps} />
    }
    return (
      <div className="text-foreground flex gap-2 font-mono p-4">
        <DefaultErrorRenderer {...childProps} />
      </div>
    )
  }

  const RenderNoResultAlert = () => {
    if (EmptyState) return EmptyState
    else return <LogsTableEmptyState />
  }

  if (!data) return null

  return (
    <section className={'h-full flex w-full flex-col flex-1'}>
      {!queryType && <LogsExplorerTableHeader />}
      <ResizablePanelGroup orientation="horizontal">
        <ResizablePanel
          id="log-table-content"
          minSize={`${panelContentMinSize}`}
          maxSize={`${panelContentMaxSize}`}
          defaultSize={`${panelContentMaxSize}`}
        >
          <div className="flex flex-col h-full">
            <div
              style={{
                maxHeight: selectedRows.size > 0 ? 40 : 0,
                overflow: 'hidden',
                transition: 'max-height 150ms ease',
              }}
            >
              <MultiSelectActionBar
                selectedRows={selectedRows}
                selectedRowsData={selectedRowsData}
                copiedFormat={copiedFormat}
                onCopy={handleCopySelectedRows}
                queryType={queryType}
                sqlQuery={sqlQuery}
                onClear={() => {
                  setSelectedRows(new Set())
                  setAnchorRowId(null)
                }}
              />
            </div>
            <DataGrid
              role="table"
              style={{ flex: '1 1 0%', minHeight: 0 }}
              className={cn('border-0', {
                'data-grid--simple-logs': queryType,
                'data-grid--logs-explorer': !queryType,
              })}
              rowHeight={40}
              headerRowHeight={queryType ? 0 : 28}
              onSelectedCellChange={(row) => {
                setCellPosition(row)
              }}
              columns={columns}
              rowClass={(row: LogData) => {
                const key = getRowKey(row)
                const isMultiSelected = selectedRows.has(key)
                const isSingleSelected = isEqual(row, selectedRow)
                return cn(
                  'font-mono tracking-tight !bg-studio hover:!bg-surface-100 cursor-pointer',
                  {
                    '!bg-surface-200 rdg-row--focused': isSingleSelected || isMultiSelected,
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
                  // gridColumn: '1 / -1' makes the fallback span all CSS grid columns,
                  // including the checkbox column we prepend, so it fills the full width.
                  <div style={{ gridColumn: '1 / -1' }}>
                    {logDataRows.length === 0 && !error && <RenderNoResultAlert />}
                    {error && <RenderErrorAlert />}
                  </div>
                ) : null,
              }}
            />
          </div>
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
