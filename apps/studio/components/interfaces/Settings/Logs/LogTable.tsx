import * as Tooltip from '@radix-ui/react-tooltip'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { IS_PLATFORM } from 'common'
import { isEqual } from 'lodash'
import { Key, ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import DataGrid, { Column, RenderRowProps, Row } from 'react-data-grid'
import toast from 'react-hot-toast'
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
  IconPlay,
} from 'ui'

import CSVButton from 'components/ui/CSVButton'
import { useCheckPermissions } from 'hooks'
import { copyToClipboard } from 'lib/helpers'
import { useProfile } from 'lib/profile'
import { LogQueryError, isDefaultLogPreviewFormat } from '.'
import AuthColumnRenderer from './LogColumnRenderers/AuthColumnRenderer'
import DatabaseApiColumnRender from './LogColumnRenderers/DatabaseApiColumnRender'
import DatabasePostgresColumnRender from './LogColumnRenderers/DatabasePostgresColumnRender'
import DefaultPreviewColumnRenderer from './LogColumnRenderers/DefaultPreviewColumnRenderer'
import FunctionsEdgeColumnRender from './LogColumnRenderers/FunctionsEdgeColumnRender'
import FunctionsLogsColumnRender from './LogColumnRenderers/FunctionsLogsColumnRender'
import LogSelection, { LogSelectionProps } from './LogSelection'
import type { LogData, QueryType } from './Logs.types'
import DefaultErrorRenderer from './LogsErrorRenderers/DefaultErrorRenderer'
import ResourcesExceededErrorRenderer from './LogsErrorRenderers/ResourcesExceededErrorRenderer'

interface Props {
  data?: Array<LogData | Object>
  onHistogramToggle?: () => void
  isHistogramShowing?: boolean
  isLoading?: boolean
  error?: LogQueryError | null
  showDownload?: boolean
  // TODO: move all common params to a context to avoid prop drilling
  queryType?: QueryType
  projectRef: string
  params: LogSelectionProps['params']
  onRun?: () => void
  onSave?: () => void
  hasEditorValue?: boolean
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
  }, [stringData])

  useEffect(() => {
    if (!data) return
    const found = data.find((datum) => isEqual(datum, focusedLog))
    if (!found) {
      // close selection panel if not found in dataset
      setFocusedLog(null)
    }
  }, [stringData])

  // [Joshen] Hmm quite hacky now, but will do
  const maxHeight = !queryType ? 'calc(100vh - 42px - 10rem)' : 'calc(100vh - 42px - 3rem)'

  const logDataRows = useMemo(() => {
    if (hasId && hasTimestamp) {
      return Object.values(logMap).sort((a, b) => b.timestamp - a.timestamp)
    } else {
      return dedupedData
    }
  }, [stringData])

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
    <div className="flex w-full items-center justify-between border-t  bg-surface-100 px-5 py-2">
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

      <div className="flex items-center gap-2">
        {onHistogramToggle && (
          <Button
            type="default"
            icon={isHistogramShowing ? <IconEye /> : <IconEyeOff />}
            onClick={onHistogramToggle}
          >
            Histogram
          </Button>
        )}
      </div>

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
          type={hasEditorValue ? 'primary' : 'alternative'}
          disabled={!hasEditorValue}
          onClick={onRun}
          iconRight={<IconPlay />}
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

  const renderNoResultAlert = () => (
    <div className="flex scale-100 flex-col items-center justify-center gap-6 text-center opacity-100">
      <div className="flex flex-col gap-1">
        <div className="relative flex h-4 w-32 items-center rounded border border-dashed border-stronger px-2" />
        <div className="relative flex h-4 w-32 items-center rounded border border-dashed border-stronger px-2" />
      </div>
      <div className="flex flex-col gap-1 px-5">
        <h3 className="text-lg text-foreground">No results found</h3>
        <p className="text-sm text-foreground-lighter">Try another search or adjust the filters</p>
      </div>
    </div>
  )

  if (!data) return null

  return (
    <>
      <section className={'flex w-full flex-col ' + (!queryType ? '' : '')} style={{ maxHeight }}>
        {!queryType && <LogsExplorerTableHeader />}
        <div className={`flex h-full flex-row ${!queryType ? 'border-l border-r' : ''}`}>
          <DataGrid
            style={{ height: '100%' }}
            className={`
            flex-1 flex-grow h-full
            ${!queryType ? 'data-grid--logs-explorer' : ' data-grid--simple-logs'}
          `}
            rowHeight={40}
            headerRowHeight={queryType ? 0 : 28}
            onSelectedCellChange={({ rowIdx }) => {
              if (!hasId) return
              setFocusedLog(data[rowIdx] as LogData)
            }}
            selectedRows={new Set([])}
            columns={columns}
            rowClass={(row: LogData) =>
              [
                'font-mono tracking-tight',
                isEqual(row, focusedLog)
                  ? '!bg-border-stronger rdg-row--focused'
                  : ' !bg-studio hover:!bg-surface-100 cursor-pointer',
              ].join(' ')
            }
            rows={logDataRows}
            rowKeyGetter={(r) => {
              if (!hasId) return JSON.stringify(r)
              const row = r as LogData
              return row.id
            }}
            // [Next 18 refactor] need to fix
            // onRowClick={setFocusedLog}
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
          {logDataRows.length > 0 ? (
            <div
              className={
                queryType
                  ? 'flex w-1/2 flex-col'
                  : focusedLog
                    ? 'flex w-1/2 flex-col'
                    : 'hidden w-0'
              }
            >
              <LogSelection
                projectRef={projectRef}
                onClose={() => setFocusedLog(null)}
                log={focusedLog}
                queryType={queryType}
                params={params}
              />
            </div>
          ) : null}
        </div>
      </section>
    </>
  )
}
export default LogTable
