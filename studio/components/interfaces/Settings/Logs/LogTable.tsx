import dayjs from 'dayjs'
import { useEffect, useState, useMemo } from 'react'
import { Alert, Button, IconEye, IconEyeOff, Input } from '@supabase/ui'
import DataGrid from '@supabase/react-data-grid'

import LogSelection, { LogSelectionProps } from './LogSelection'
import { LogData, QueryType } from './Logs.types'
import { SeverityFormatter, ResponseCodeFormatter, HeaderFormmater } from './LogsFormatters'
import { isDefaultLogPreviewFormat } from './Logs.utils'
// column renders
import DatabaseApiColumnRender from './LogColumnRenderers/DatabaseApiColumnRender'
import DatabasePostgresColumnRender from './LogColumnRenderers/DatabasePostgresColumnRender'
import CSVButton from 'components/ui/CSVButton'
import DefaultPreviewColumnRenderer from './LogColumnRenderers/DefaultPreviewColumnRenderer'
import { LogQueryError } from '.'
import ResourcesExceededErrorRenderer from './LogsErrorRenderers/ResourcesExceededErrorRenderer'
import DefaultErrorRenderer from './LogsErrorRenderers/DefaultErrorRenderer'

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

interface FormatterArg {
  column: {
    key: string
    name: string
    resizable: boolean
    header: string
    minWidth: number
    idx: number
    frozen: boolean
    isLastFrozenColumn: boolean
    rowGroup: boolean
    sortable: boolean
  }
  isCellSelected: boolean
  onRowChange: Function
  row: any
}

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
  showDownload,
  error,
  projectRef,
  params,
}: Props) => {
  const [focusedLog, setFocusedLog] = useState<LogData | null>(null)
  const firstRow: LogData | undefined = data?.[0] as LogData
  const columnNames = Object.keys(data[0] || {})
  const hasId = columnNames.includes('id')
  const hasTimestamp = columnNames.includes('timestamp')

  const DEFAULT_COLUMNS = columnNames.map((v) => {
    let formatter = undefined

    formatter = (received: FormatterArg) => {
      const value = received.row?.[v]
      if (value && typeof value === 'object') {
        return `[Object]`
      } else if (value === null) {
        return 'NULL'
      } else {
        return String(value)
      }
    }
    return { key: v, name: v, resizable: true, formatter, header: v, minWidth: 128 }
  })

  let columns
  if (!queryType) {
    columns = DEFAULT_COLUMNS
  } else {
    switch (queryType) {
      case 'api':
        columns = DatabaseApiColumnRender
        break

      case 'database':
        columns = DatabasePostgresColumnRender
        break

      case 'fn_edge':
        columns = [
          {
            key: 'timestamp',
            headerRenderer: () => (
              <div className="flex w-full justify-end h-full">
                <HeaderFormmater value={'timestamp'} />
              </div>
            ),
            name: 'timestamp',
            formatter: (data: any) => (
              <span className="flex w-full h-full items-center gap-1">
                <span className="text-xs">
                  {dayjs(data?.row?.timestamp / 1000).format('DD MMM')}
                </span>
                <span className="text-xs">
                  {dayjs(data?.row?.timestamp / 1000).format('HH:mm:ss')}
                </span>
              </span>
            ),
            width: 128,
          },
          {
            key: 'status_code',
            headerRenderer: () => <HeaderFormmater value={'Status'} />,
            name: 'status_code',
            formatter: (data: any) => (
              <ResponseCodeFormatter row={data} value={data.row.status_code} />
            ),
            width: 0,
            resizable: true,
          },
          {
            key: 'method',
            headerRenderer: () => <HeaderFormmater value={'method'} />,
            width: 0,
            resizable: true,
          },
          {
            key: 'id',
            headerRenderer: () => <HeaderFormmater value={'id'} />,
            name: 'id',
            resizable: true,
          },
        ]
        break
      case 'functions':
        columns = [
          {
            key: 'timestamp',
            headerRenderer: () => (
              <div className="flex w-full justify-end h-full">
                <HeaderFormmater value={'timestamp'} />
              </div>
            ),
            name: 'timestamp',
            formatter: (data: any) => (
              <span className="flex w-full h-full items-center gap-1">
                <span className="text-xs !text-scale-1100">
                  {dayjs(data?.row?.timestamp / 1000).format('DD MMM')}
                </span>
                <span className="text-xs !text-scale-1100">
                  {dayjs(data?.row?.timestamp / 1000).format('HH:mm:ss')}
                </span>
              </span>
            ),
            width: 128,
            resizable: true,
          },
          {
            key: 'level',
            headerRenderer: () => <HeaderFormmater value={'Level'} />,
            name: 'level',
            formatter: (data: any) => <SeverityFormatter value={data.row.level} />,
            width: 24,
            resizable: true,
          },
          {
            key: 'event_message',
            headerRenderer: () => <HeaderFormmater value={'Event message'} />,
            resizable: true,
          },
        ]
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
    if (!hasId || data === null) return
    if (focusedLog && !(focusedLog.id in logMap)) {
      setFocusedLog(null)
    }
  }, [stringData])

  if (!data) return null

  // [Joshen] Hmm quite hacky now, but will do
  const maxHeight = !queryType ? 'calc(100vh - 42px - 10rem)' : 'calc(100vh - 42px - 3rem)'

  const logDataRows = useMemo(() => {
    if (hasId && hasTimestamp) {
      return Object.values(logMap).sort((a, b) => b.timestamp - a.timestamp)
    } else {
      return dedupedData
    }
  }, [stringData])

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
      <div className="flex justify-center px-5">
        <Alert
          variant="danger"
          title="Sorry! An error occured when fetching data."
          withIcon
          className="w-1/2"
        >
          <Renderer {...childProps} />
        </Alert>
      </div>
    )
  }

  return (
    <>
      <section
        className={'flex flex-col w-full ' + (!queryType ? 'shadow-lg' : '')}
        style={{ maxHeight }}
      >
        {!queryType && (
          <div>
            <div
              className="
            w-full bg-scale-100 dark:bg-scale-300 
            rounded-tl rounded-tr
            border-t
            border-l
            border-r
            flex items-center justify-between
            px-5 py-2
      "
            >
              <div className="flex items-center gap-2">
                {data && data.length ? (
                  <>
                    <span className="text-sm text-scale-1200">Query results</span>
                    <span className="text-sm text-scale-1100">{data && data.length}</span>
                  </>
                ) : (
                  <span className="text-xs text-scale-1200">Results will be shown below</span>
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
                {showDownload && <CSVButton data={data}>Download</CSVButton>}
              </div>
            </div>
          </div>
        )}
        <div className={`flex flex-row h-full ${!queryType ? 'border-l border-r' : ''}`}>
          <DataGrid
            style={{ height: '100%' }}
            className={`
            flex-grow flex-1
            ${!queryType ? 'data-grid--logs-explorer' : ' data-grid--simple-logs'} 
          `}
            rowHeight={40}
            headerRowHeight={queryType ? 0 : 28}
            onSelectedCellChange={({ idx, rowIdx }) => {
              if (!hasId) return
              setFocusedLog(data[rowIdx] as LogData)
            }}
            noRowsFallback={
              !isLoading ? (
                <>
                  <div className="py-4 w-full h-full flex-col space-y-12">
                    {!error && (
                      <div
                        className={`transition-all
                      duration-500
                      delay-200
                      
                      flex
                      flex-col
                      items-center
                  
                      gap-6
                      text-center
                      mt-16
                      opacity-100 
                      scale-100
                      
                      justify-center
                    `}
                      >
                        <>
                          <div className="flex flex-col gap-1">
                            <div className="relative border border-scale-600 border-dashed dark:border-scale-900 w-32 h-4 rounded px-2 flex items-center"></div>
                            <div className="relative border border-scale-600 border-dashed dark:border-scale-900 w-32 h-4 rounded px-2 flex items-center">
                              <div className="absolute right-1 -bottom-4">
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
                            <h3 className="text-lg text-scale-1200">No results</h3>
                            <p className="text-sm text-scale-900">
                              Try another search, or adjusting the filters
                            </p>
                          </div>
                        </>
                      </div>
                    )}
                    {error && renderErrorAlert()}
                  </div>
                </>
              ) : null
            }
            columns={columns as any}
            rowClass={(r) => {
              const row = r as LogData

              let classes = []
              classes.push(
                `${
                  row.id === focusedLog?.id ? '!bg-scale-400 rdg-row--focussed' : 'cursor-pointer'
                }`
              )

              return classes.join(' ')
            }}
            rows={logDataRows}
            rowKeyGetter={(r) => {
              if (!hasId) return Object.keys(r)[0]
              const row = r as LogData
              return row.id
            }}
            onRowClick={(r) => setFocusedLog(r)}
          />
          {logDataRows.length > 0 ? (
            <div
              className={
                queryType
                  ? 'w-1/2 flex flex-col'
                  : focusedLog
                  ? 'w-1/2 flex flex-col'
                  : 'w-0 hidden'
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
