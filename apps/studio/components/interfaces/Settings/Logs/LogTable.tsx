import { PermissionAction } from '@supabase/shared-types/out/constants'
import { ContextMenuContent } from '@ui/components/shadcn/ui/context-menu'
import { IS_PLATFORM, useParams } from 'common'
import { Copy, Eye, EyeOff, Play } from 'lucide-react'
import { Key, ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import DataGrid, { Column, RenderRowProps, Row } from 'react-data-grid'
import { toast } from 'sonner'
import {
  Button,
  Checkbox,
  cn,
  ContextMenu,
  ContextMenuItem,
  ContextMenuTrigger,
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
import MultigresColumnRender from './LogColumnRenderers/MultigresColumnRender'
import type { LogData, LogQueryError, QueryType } from './Logs.types'
import {
  formatLogsAsCsv,
  formatLogsAsJson,
  formatLogsAsMarkdown,
  isDefaultLogPreviewFormat,
} from './Logs.utils'
import LogSelection from './LogSelection'
import { DefaultErrorRenderer } from './LogsErrorRenderers/DefaultErrorRenderer'
import { MissingLimitErrorRenderer } from './LogsErrorRenderers/MissingLimitErrorRenderer'
import ResourcesExceededErrorRenderer from './LogsErrorRenderers/ResourcesExceededErrorRenderer'
import { LogsTableEmptyState } from './LogsTableEmptyState'
import { MultiSelectActionBar, type LogCopyFormat } from './MultiSelectActionBar'
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import { DownloadResultsButton } from '@/components/ui/DownloadResultsButton'
import { useSelectedLog } from '@/hooks/analytics/useSelectedLog'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'
import { useProfile } from '@/lib/profile'
import { SHORTCUT_IDS } from '@/state/shortcuts/registry'
import { useShortcut } from '@/state/shortcuts/useShortcut'
import type { ResponseError } from '@/types'

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
  const [selectedRow, setSelectedRow] = useState<LogData | null>(null)
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set())
  const [copiedFormat, setCopiedFormat] = useState<LogCopyFormat | null>(null)
  const triggerRef = useRef<HTMLDivElement>(null)
  const [activeRow, setActiveRow] = useState<LogData | null>(null)
  const [contextMenuKey, setContextMenuKey] = useState(0)

  const handleRowContextMenu = useCallback((e: React.MouseEvent, row: LogData) => {
    e.preventDefault()
    setActiveRow(row)
    // Force re-render of ContextMenuContent to update the current position.
    setContextMenuKey((prev) => prev + 1)
    const trigger = triggerRef.current
    if (!trigger) return
    trigger.style.left = `${e.clientX}px`
    trigger.style.top = `${e.clientY}px`
    trigger.dispatchEvent(
      new MouseEvent('contextmenu', {
        bubbles: true,
        clientX: e.clientX,
        clientY: e.clientY,
      })
    )
  }, [])

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
          <Checkbox
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
        return <span>{formatCellValue(row?.[v])}</span>
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
      case 'multigres':
        columns = MultigresColumnRender
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

  const onRowClick = useCallback(
    (row: LogData) => {
      // Regular single click — clear multi-select, open side panel
      setSelectedRows(new Set())
      setSelectedRow(row)
      onSelectedLogChange?.(row)
    },
    [onSelectedLogChange]
  )

  const RowRenderer = useCallback<(key: Key, props: RenderRowProps<LogData, unknown>) => ReactNode>(
    (key, props) => {
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
          onClick={handleClick}
          onContextMenu={(e) => handleRowContextMenu(e, props.row)}
        />
      )
    },
    [handleRowContextMenu, onRowClick]
  )

  const formatCellValue = (value: any) => {
    return value && typeof value === 'object'
      ? JSON.stringify(value)
      : value === null
        ? 'NULL'
        : String(value)
  }

  // Arrow-key navigation. Unlike mouse-click (`onRowClick`), keyboard nav must
  // preserve any existing multi-select checkmarks — clearing `selectedRows`
  // here would wipe the user's checked rows the moment they press an arrow.
  const navigate = (direction: 'down' | 'up') => {
    if (logDataRows.length === 0) return
    const focusRow = (row: LogData) => {
      setSelectedRow(row)
      onSelectedLogChange?.(row)
    }
    if (!selectedRow) {
      focusRow(logDataRows[0])
      return
    }
    const selectedKey = getRowKey(selectedRow)
    const currentIdx = logDataRows.findIndex((row) => getRowKey(row) === selectedKey)
    if (currentIdx === -1) {
      focusRow(logDataRows[0])
      return
    }
    if (direction === 'down' && currentIdx < logDataRows.length - 1) {
      focusRow(logDataRows[currentIdx + 1])
    } else if (direction === 'up' && currentIdx > 0) {
      focusRow(logDataRows[currentIdx - 1])
    }
  }

  useShortcut(SHORTCUT_IDS.LOGS_PREVIEW_START_NAV_DOWN, () => navigate('down'), {
    enabled: logDataRows.length > 0,
  })

  useShortcut(SHORTCUT_IDS.LOGS_PREVIEW_START_NAV_UP, () => navigate('up'), {
    enabled: logDataRows.length > 0,
  })

  useShortcut(
    SHORTCUT_IDS.LOGS_PREVIEW_TOGGLE_ALL_SELECTION,
    () => {
      if (selectedRows.size === logDataRows.length) {
        setSelectedRows(new Set())
      } else {
        setSelectedRows(new Set(logDataRows.map((row) => getRowKey(row))))
        setSelectedRow(null)
        onSelectedLogChange?.(null)
      }
    },
    { enabled: logDataRows.length > 0 }
  )

  useShortcut(
    SHORTCUT_IDS.LOGS_PREVIEW_TOGGLE_ROW_SELECTION,
    () => {
      if (!selectedRow) return
      const key = getRowKey(selectedRow)
      const next = new Set(selectedRows)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      setSelectedRows(next)
    },
    { enabled: selectedRow !== null }
  )

  useShortcut(
    SHORTCUT_IDS.LOGS_PREVIEW_CLOSE_PANEL,
    () => {
      onSelectedLogChange?.(null)
      setSelectedRow(null)
    },
    { enabled: selectionOpen }
  )

  useShortcut(
    SHORTCUT_IDS.LOGS_PREVIEW_EXIT_SELECTION,
    () => {
      setSelectedRows(new Set())
      ;(document.activeElement as HTMLElement | null)?.blur()
    },
    { enabled: !selectionOpen && selectedRows.size > 0 }
  )

  useEffect(() => {
    if (!isSelectedLogLoading && !selectedLog) {
      setSelectedRow(null)
    }
  }, [selectedLog, isSelectedLogLoading])

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
    }
  }, [isLoading])

  // Copy feedback timeout
  useEffect(() => {
    if (!copiedFormat) return
    const timer = setTimeout(() => setCopiedFormat(null), 2000)
    return () => clearTimeout(timer)
  }, [copiedFormat])

  function handleCopySelectedRows(format: LogCopyFormat) {
    let text = ''
    if (format === 'json') text = formatLogsAsJson(selectedRowsData)
    if (format === 'markdown') text = formatLogsAsMarkdown(selectedRowsData)
    if (format === 'csv') text = formatLogsAsCsv(selectedRowsData)

    copyToClipboard(text, () => {
      setCopiedFormat(format)
      toast.success(
        `Copied ${selectedRowsData.length} log${selectedRowsData.length !== 1 ? 's' : ''} as ${format.toUpperCase()}`
      )
    })
  }

  useShortcut(SHORTCUT_IDS.RESULTS_COPY_JSON, () => handleCopySelectedRows('json'), {
    enabled: selectedRowsData.length > 0,
    conflictBehavior: 'allow',
  })

  useShortcut(SHORTCUT_IDS.RESULTS_COPY_MARKDOWN, () => handleCopySelectedRows('markdown'), {
    enabled: selectedRowsData.length > 0,
    conflictBehavior: 'allow',
  })

  useShortcut(SHORTCUT_IDS.RESULTS_COPY_CSV, () => handleCopySelectedRows('csv'), {
    enabled: selectedRowsData.length > 0,
    conflictBehavior: 'allow',
  })

  const logsExplorerTableHeader = (
    <div
      className={cn(
        'flex w-full items-center justify-between border-t bg-surface-100 px-5 py-2',
        className,
        { hidden: !showHeader }
      )}
    >
      <div className="flex items-center gap-2">
        <DownloadResultsButton
          variant="text"
          text={`Results ${data && data.length ? `(${data.length})` : ''}`}
          results={data}
          fileName={`supabase-logs-${ref}.csv`}
          enableCopyShortcuts={selectedRowsData.length === 0}
        />
      </div>

      {showHistogramToggle && (
        <div className="flex items-center gap-2">
          <Button
            variant="default"
            icon={isHistogramShowing ? <Eye /> : <EyeOff />}
            onClick={onHistogramToggle}
          >
            Histogram
          </Button>
        </div>
      )}

      <div className="gap-x-2 flex items-center">
        {IS_PLATFORM && (
          <ButtonTooltip
            variant="default"
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
          variant="primary"
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

  const renderErrorAlert = () => {
    if (!error) return null
    const childProps = {
      isCustomQuery: queryType ? false : true,
      error: error!,
    }
    if (
      typeof error === 'object' &&
      error.error?.errors.find((err) => err.reason === 'missingLimit')
    ) {
      return <MissingLimitErrorRenderer />
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

  const renderNoResultAlert = () => {
    if (EmptyState) return EmptyState
    return <LogsTableEmptyState />
  }

  if (!data) return null

  return (
    <section className={'h-full flex w-full flex-col flex-1'}>
      {!queryType && logsExplorerTableHeader}
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
                }}
              />
            </div>
            <ContextMenu modal={false}>
              <ContextMenuTrigger asChild>
                <div ref={triggerRef} className="fixed pointer-events-none w-0 h-0" />
              </ContextMenuTrigger>
              <ContextMenuContent key={contextMenuKey}>
                <ContextMenuItem
                  className="gap-x-2"
                  onSelect={() => {
                    const eventMessage = activeRow?.event_message
                    if (eventMessage) {
                      copyToClipboard(eventMessage, () => {
                        toast.success('Copied to clipboard')
                      })
                    }
                  }}
                >
                  <Copy size={14} />
                  <span className="text-xs">Copy event message</span>
                </ContextMenuItem>
              </ContextMenuContent>
            </ContextMenu>
            <DataGrid
              role="table"
              style={{ flex: '1 1 0%', minHeight: 0 }}
              className={cn('border-t-0! border-b-0!', {
                'data-grid--simple-logs': queryType,
                'data-grid--logs-explorer': !queryType,
              })}
              rowHeight={40}
              headerRowHeight={queryType ? 0 : 28}
              columns={columns}
              rowClass={(row: LogData) => {
                const key = getRowKey(row)
                const isMultiSelected = selectedRows.has(key)
                const isSingleSelected = selectedRow !== null && getRowKey(selectedRow) === key
                return cn(
                  'font-mono tracking-tight bg-studio! hover:bg-surface-100! cursor-pointer',
                  {
                    'bg-surface-200! rdg-row--focused': isSingleSelected || isMultiSelected,
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
                    {logDataRows.length === 0 && !error && renderNoResultAlert()}
                    {error && renderErrorAlert()}
                  </div>
                ) : null,
              }}
            />
          </div>
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
