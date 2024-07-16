import * as Tooltip from '@radix-ui/react-tooltip'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { IS_PLATFORM } from 'common'
import { isEqual } from 'lodash'
import { Play } from 'lucide-react'
import { Key, ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import DataGrid, { Column, RenderRowProps, Row } from 'react-data-grid'
import toast from 'react-hot-toast'

import CSVButton from 'components/ui/CSVButton'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { copyToClipboard } from 'lib/helpers'
import { useProfile } from 'lib/profile'
import {
  Alert,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  IconChevronDown,
  IconClipboard,
  IconDownload,
  IconEye,
  IconEyeOff,
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
import DefaultErrorRenderer from './LogsErrorRenderers/DefaultErrorRenderer'
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
  const [focusedLog, setFocusedLog] = useState<LogData | null>(null)
  const firstRow: LogData | undefined = data?.[0] as LogData
  const { profile } = useProfile()
  const canCreateLogQuery = useCheckPermissions(PermissionAction.CREATE, 'user_content', {
    resource: { type: 'log_sql', owner_id: profile?.id },
    subject: { id: profile?.id },
  })

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

  const DEFAULT_COLUMNS = columnNames.map((v: keyof LogData, idx) => {
    const result: Column<LogData> = {
      key: `logs-column-${idx}`,
      name: v as string,
      resizable: true,
      renderCell: (props) => {
        const value = props.row?.[v]
        if (value && typeof value === 'object') {
          return JSON.stringify(value)
        } else if (value === null) {
          return 'NULL'
        } else {
          return String(value)
        }
      },
      renderHeaderCell: (props) => {
        return <div className="flex items-center">{v}</div>
      },
      minWidth: 128,
      maxWidth: v === 'timestamp' ? 240 : 2400, // Without this, the column flickers on first render
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
            <Button type="text" iconRight={<IconChevronDown />}>
              Results {data && data.length ? `(${data.length})` : ''}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={downloadCSV} className="space-x-2">
              <IconDownload size="tiny" />
              <div>Download CSV</div>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={copyResultsToClipboard} className="space-x-2">
              <IconClipboard size="tiny" />
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
            icon={isHistogramShowing ? <IconEye /> : <IconEyeOff />}
            onClick={onHistogramToggle}
          >
            Histogram
          </Button>
        </div>
      )}

      <div className="space-x-2">
        {IS_PLATFORM && (
          <Tooltip.Root delayDuration={0}>
            <Tooltip.Trigger asChild>
              <Button
                type="default"
                onClick={onSave}
                disabled={!canCreateLogQuery || !hasEditorValue}
              >
                Save query
              </Button>
            </Tooltip.Trigger>
            {!canCreateLogQuery && (
              <Tooltip.Portal>
                <Tooltip.Content side="bottom">
                  <Tooltip.Arrow className="radix-tooltip-arrow" />
                  <div
                    className={[
                      'rounded bg-alternative py-1 px-2 leading-none shadow',
                      'border border-background',
                    ].join(' ')}
                  >
                    <span className="text-xs text-foreground">
                      You need additional permissions to save your query
                    </span>
                  </div>
                </Tooltip.Content>
              </Tooltip.Portal>
            )}
          </Tooltip.Root>
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

  const renderErrorAlert = () => {
    if (!error) return null
    const childProps = {
      isCustomQuery: queryType ? false : true,
      error: error!,
    }
    let Renderer = DefaultErrorRenderer
    if (
      typeof error === 'object' &&
      error.error?.errors.find((err) => err.reason === 'resourcesExceeded')
    ) {
      Renderer = ResourcesExceededErrorRenderer
    }

    return (
      <div className="flex w-1/2 justify-center px-5">
        <Alert variant="danger" title="Sorry! An error occurred when fetching data." withIcon>
          <Renderer {...childProps} />
        </Alert>
      </div>
    )
  }

  const renderNoResultAlert = () => {
    if (emptyState) return emptyState
    else
      return (
        <div className="flex scale-100 flex-col items-center justify-center gap-6 text-center opacity-100">
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
    <section className={'flex w-full flex-col h-full'} style={{ maxHeight }}>
      {!queryType && <LogsExplorerTableHeader />}
      <div className={`flex h-full flex-row overflow-x-auto`}>
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
                  <div className="mx-auto flex h-full w-full items-center justify-center space-y-12 py-4 transition-all delay-200 duration-500">
                    {!error && renderNoResultAlert()}
                    {error && renderErrorAlert()}
                  </div>
                ) : null,
              }}
            />
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
      </div>
    </section>
  )
}
export default LogTable
