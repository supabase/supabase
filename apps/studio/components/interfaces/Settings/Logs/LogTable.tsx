import { PermissionAction } from '@supabase/shared-types/out/constants'
import { IS_PLATFORM } from 'common'
import { isEqual } from 'lodash'
import { ChevronDown, Clipboard, Download, Eye, EyeOff, Play } from 'lucide-react'
import { Key, ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import DataGrid, { Column, RenderRowProps, Row } from 'react-data-grid'
import { toast } from 'sonner'

import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import CSVButton from 'components/ui/CSVButton'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { copyToClipboard } from 'lib/helpers'
import { useProfile } from 'lib/profile'
import { Item, Menu, useContextMenu } from 'react-contexify'
import { createPortal } from 'react-dom'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
  cn,
} from 'ui'
import AuthColumnRenderer from './LogColumnRenderers/AuthColumnRenderer'
import DatabaseApiColumnRender from './LogColumnRenderers/DatabaseApiColumnRender'
import DatabasePostgresColumnRender from './LogColumnRenderers/DatabasePostgresColumnRender'
import DefaultPreviewColumnRenderer from './LogColumnRenderers/DefaultPreviewColumnRenderer'
import FunctionsEdgeColumnRender from './LogColumnRenderers/FunctionsEdgeColumnRender'
import FunctionsLogsColumnRender from './LogColumnRenderers/FunctionsLogsColumnRender'
import LogSelection, { LogSelectionProps } from './LogSelection'
import type { LogData, LogQueryError, QueryType } from './Logs.types'
import { isDefaultLogPreviewFormat } from './Logs.utils'
import { DefaultErrorRenderer } from './LogsErrorRenderers/DefaultErrorRenderer'
import ResourcesExceededErrorRenderer from './LogsErrorRenderers/ResourcesExceededErrorRenderer'

interface Props {
  data?: Array<LogData | Object>
  onHistogramToggle?: () => void
  isHistogramShowing?: boolean
  isLoading?: boolean
  error?: LogQueryError | null
  showDownload?: boolean
  queryType?: QueryType
  projectRef: string
  params: LogSelectionProps['params']
  onRun?: () => void
  onSave?: () => void
  hasEditorValue?: boolean
  maxHeight?: string
  className?: string
  collectionName?: string // Used for warehouse queries
  warehouseError?: string
  emptyState?: ReactNode
  showHeader?: boolean
  showHistogramToggle?: boolean
}
type LogMap = { [id: string]: LogData }

/**
 * Logs table view with focus side panel
 *
 * When in custom data display mode, the side panel will not open when focusing on logs.
 */
const LogTable = ({
  data = [],
  queryType,
  onHistogramToggle,
  isHistogramShowing,
  isLoading,
  error,
  projectRef,
  params,
  onRun,
  onSave,
  hasEditorValue,
  maxHeight,
  className,
  collectionName,
  emptyState,
  showHeader = true,
  showHistogramToggle = true,
}: Props) => {
  const { profile } = useProfile()
  const { show: showContextMenu } = useContextMenu()

  const [cellPosition, setCellPosition] = useState<any>()
  const [focusedLog, setFocusedLog] = useState<LogData | null>(null)

  const canCreateLogQuery = useCheckPermissions(PermissionAction.CREATE, 'user_content', {
    resource: { type: 'log_sql', owner_id: profile?.id },
    subject: { id: profile?.id },
  })

  const firstRow: LogData | undefined = data?.[0] as LogData

  // move timestamp to the first column
  function getFirstRow() {
    if (!firstRow) return {}

    const { timestamp, ...rest } = firstRow || {}

    if (!timestamp) return firstRow

    return { timestamp, ...rest }
  }

  const columnNames = Object.keys(getFirstRow() || {})
  const hasId = columnNames.includes('id')
  const hasTimestamp = columnNames.includes('timestamp')

  const LOGS_EXPLORER_CONTEXT_MENU_ID = 'logs-explorer-context-menu'
  const DEFAULT_COLUMNS = columnNames.map((v: keyof LogData, idx) => {
    const column = `logs-column-${idx}`
    const result: Column<LogData> = {
      key: column,
      name: v as string,
      resizable: true,
      renderCell: ({ row }: any) => {
        return (
          <span onContextMenu={(e) => showContextMenu(e, { id: LOGS_EXPLORER_CONTEXT_MENU_ID })}>
            {formatCellValue(row?.[v])}
          </span>
        )
      },
      renderHeaderCell: (props) => {
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
      case 'warehouse':
        columns = DEFAULT_COLUMNS
        break
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

      default:
        if (firstRow && isDefaultLogPreviewFormat(firstRow)) {
          columns = DefaultPreviewColumnRenderer
        } else {
          columns = DEFAULT_COLUMNS
        }
        break
    }
  }

  const stringData = JSON.stringify(data)
  const [dedupedData, logMap] = useMemo<[LogData[], LogMap]>(() => {
    const deduped = [...new Set(data)] as LogData[]

    if (!hasId) {
      return [deduped, {} as LogMap]
    }

    const map = deduped.reduce((acc: LogMap, d: LogData) => {
      acc[d.id] = d
      return acc
    }, {}) as LogMap

    return [deduped, map]
  }, [data, hasId])

  useEffect(() => {
    if (!data) return
    const found = data.find((datum) => isEqual(datum, focusedLog))
    if (!found) {
      // close selection panel if not found in dataset
      setFocusedLog(null)
    }
  }, [data, focusedLog, stringData])

  const logDataRows = useMemo(() => {
    if (hasId && hasTimestamp) {
      return Object.values(logMap).sort((a, b) => b.timestamp - a.timestamp)
    } else {
      return dedupedData
    }
  }, [dedupedData, hasId, hasTimestamp, logMap])

  const RowRenderer = useCallback<(key: Key, props: RenderRowProps<LogData, unknown>) => ReactNode>(
    (key, props) => {
      return <Row key={key} {...props} isRowSelected={false} selectedCellIdx={undefined} />
    },
    []
  )

  const formatCellValue = (value: any) => {
    return value && typeof value === 'object'
      ? JSON.stringify(value)
      : value === null
        ? 'NULL'
        : String(value)
  }

  const onCopyCell = () => {
    if (cellPosition) {
      const { row, column } = cellPosition
      const cellValue = row?.[column.name] ?? ''
      const value = formatCellValue(cellValue)
      copyToClipboard(value)
    }
  }

  const copyResultsToClipboard = () => {
    copyToClipboard(stringData, () => {
      toast.success('Results copied to clipboard')
    })
  }

  const downloadCsvRef = useRef<HTMLDivElement>(null)
  function downloadCSV() {
    downloadCsvRef.current?.click()
  }

  const LogsExplorerTableHeader = () => (
    <div
      className={cn(
        'flex w-full items-center justify-between border-t  bg-surface-100 px-5 py-2',
        className,
        { hidden: !showHeader }
      )}
    >
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="text" iconRight={<ChevronDown size={14} />}>
              Results {data && data.length ? `(${data.length})` : ''}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={downloadCSV} className="space-x-2">
              <Download size={14} />
              <div>Download CSV</div>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={copyResultsToClipboard} className="space-x-2">
              <Clipboard size={14} />
              <div>Copy to clipboard</div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Using .hidden with a ref so I don't have to duplicate the code to download the CSV - Jordi */}
      <div className="hidden">
        <CSVButton buttonType={'text'} data={data}>
          <div ref={downloadCsvRef}>Download CSV</div>
        </CSVButton>
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
      <div className="text-foreground flex gap-2 font-mono px-6">
        <DefaultErrorRenderer {...childProps} />
      </div>
    )
  }

  const RenderNoResultAlert = () => {
    if (emptyState) return emptyState
    else
      return (
        <div className="flex scale-100 flex-col items-center justify-center gap-6 text-center opacity-100 h-full">
          <div className="flex flex-col gap-1">
            <div className="relative flex h-4 w-32 items-center rounded border border-dashed border-stronger px-2" />
            <div className="relative flex h-4 w-32 items-center rounded border border-dashed border-stronger px-2" />
          </div>
          <div className="flex flex-col gap-1 px-5">
            <h3 className="text-lg text-foreground">No results found</h3>
            <p className="text-sm text-foreground-lighter">
              Try another search or adjust the filters
            </p>
          </div>
        </div>
      )
  }

  if (!data) return null

  return (
    <section className={'flex w-full flex-col h-screen'} style={{ maxHeight }}>
      {!queryType && <LogsExplorerTableHeader />}

      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel defaultSize={focusedLog ? 60 : 100}>
          <DataGrid
            role="table"
            style={{ height: '100%' }}
            className={cn('flex-1 flex-grow h-full', {
              'data-grid--simple-logs': queryType,
              'data-grid--logs-explorer': !queryType,
            })}
            rowHeight={40}
            headerRowHeight={queryType ? 0 : 28}
            onSelectedCellChange={(row) => {
              setFocusedLog(row.row as LogData)
              setCellPosition(row)
            }}
            selectedRows={new Set([])}
            columns={columns}
            rowClass={(row: LogData) =>
              [
                'font-mono tracking-tight',
                isEqual(row, focusedLog)
                  ? '!bg-surface-300 rdg-row--focused'
                  : ' !bg-studio hover:!bg-surface-100 cursor-pointer',
              ].join(' ')
            }
            rows={logDataRows}
            rowKeyGetter={(r) => {
              if (!hasId) return JSON.stringify(r)
              const row = r as LogData
              return row.id
            }}
            renderers={{
              renderRow: RowRenderer,
              noRowsFallback: !isLoading ? (
                <div className="">
                  {logDataRows.length === 0 && !error && <RenderNoResultAlert />}
                  {error && <RenderErrorAlert />}
                </div>
              ) : null,
            }}
          />
          {typeof window !== 'undefined' &&
            createPortal(
              <Menu id={LOGS_EXPLORER_CONTEXT_MENU_ID} animation={false}>
                <Item onClick={onCopyCell}>
                  <Clipboard size={14} />
                  <span className="ml-2 text-xs">Copy cell content</span>
                </Item>
              </Menu>,
              document.body
            )}
        </ResizablePanel>
        <ResizableHandle />
        {focusedLog && (
          <ResizablePanel defaultSize={40}>
            <LogSelection
              projectRef={projectRef}
              onClose={() => setFocusedLog(null)}
              log={focusedLog}
              queryType={queryType}
              params={params}
              collectionName={collectionName}
            />
          </ResizablePanel>
        )}
      </ResizablePanelGroup>
    </section>
  )
}
export default LogTable
