import { isEqual } from 'lodash'
import { Key, ReactNode, useCallback, useEffect, useMemo, useState } from 'react'
import DataGrid, { Column, RenderRowProps, Row } from 'react-data-grid'
import { Alert, Button, IconClipboard, IconEye, IconEyeOff } from 'ui'

import CSVButton from 'components/ui/CSVButton'
import { useStore } from 'hooks'
import { copyToClipboard } from 'lib/helpers'
import { LogQueryError, isDefaultLogPreviewFormat } from '.'
import AuthColumnRenderer from './LogColumnRenderers/AuthColumnRenderer'
import DatabaseApiColumnRender from './LogColumnRenderers/DatabaseApiColumnRender'
import DatabasePostgresColumnRender from './LogColumnRenderers/DatabasePostgresColumnRender'
import DefaultPreviewColumnRenderer from './LogColumnRenderers/DefaultPreviewColumnRenderer'
import FunctionsEdgeColumnRender from './LogColumnRenderers/FunctionsEdgeColumnRender'
import FunctionsLogsColumnRender from './LogColumnRenderers/FunctionsLogsColumnRender'
import LogSelection, { LogSelectionProps } from './LogSelection'
import { LogData, QueryType } from './Logs.types'
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
}: Props) => {
  const { ui } = useStore()
  const [focusedLog, setFocusedLog] = useState<LogData | null>(null)
  const firstRow: LogData | undefined = data?.[0] as LogData
  const columnNames = Object.keys(data[0] || {})
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
        return v
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
      return <Row {...props} isRowSelected={false} selectedCellIdx={undefined} />
    },
    []
  )

  const copyResultsToClipboard = () => {
    copyToClipboard(stringData, () => {
      ui.setNotification({ category: 'success', message: 'Results copied to clipboard.' })
    })
  }

  const LogsExplorerTableHeader = () => (
    <div className="flex w-full items-center justify-between rounded-tl rounded-tr border-t border-l border-r bg-surface-100 px-5 py-2">
      <div className="flex items-center gap-2">
        {data && data.length ? (
          <>
            <span className="text-sm text-foreground">Query results</span>
            <span className="text-sm text-foreground-light">{data && data.length}</span>
          </>
        ) : (
          <span className="text-xs text-foreground">Results will be shown below</span>
        )}
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
        <Button type="default" icon={<IconClipboard />} onClick={copyResultsToClipboard}>
          Copy to clipboard
        </Button>
        <CSVButton data={data}>Download</CSVButton>
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
    <div className="mt-16 flex scale-100 flex-col items-center justify-center gap-6 text-center opacity-100">
      <div className="flex flex-col gap-1">
        <div className="relative flex h-4 w-32 items-center rounded border border-dashed border-stronger px-2"></div>
        <div className="relative flex h-4 w-32 items-center rounded border border-dashed border-stronger px-2">
          <div className="absolute right-1 -bottom-4 text-foreground-light">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-1 px-5">
        <h3 className="text-lg text-foreground">No results</h3>
        <p className="text-sm text-foreground-lighter">
          Try another search, or adjusting the filters
        </p>
      </div>
    </div>
  )

  if (!data) return null

  return (
    <>
      <section
        className={'flex w-full flex-col ' + (!queryType ? 'shadow-lg' : '')}
        style={{ maxHeight }}
      >
        {!queryType && <LogsExplorerTableHeader />}
        <div className={`flex h-full flex-row ${!queryType ? 'border-l border-r' : ''}`}>
          <DataGrid
            style={{ height: '100%' }}
            className={`
            flex-1 flex-grow
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
                  : ' !bg-background hover:!bg-surface-100 cursor-pointer',
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
