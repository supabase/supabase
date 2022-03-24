import dayjs from 'dayjs'
import { useEffect, useState, useMemo } from 'react'
import { Button, IconDownloadCloud, IconEye, Typography } from '@supabase/ui'
import DataGrid from '@supabase/react-data-grid'

import LogSelection from './LogSelection'
import { LogData, QueryType } from './Logs.types'
import { SeverityFormatter, ResponseCodeFormatter, HeaderFormmater } from './LogsFormatters'

// column renders
import DatabaseApiColumnRender from './LogColumnRenderers/DatabaseApiColumnRender'
import DatabasePostgresColumnRender from './LogColumnRenderers/DatabasePostgresColumnRender'

interface Props {
  isCustomQuery: boolean
  data?: Array<LogData | Object>
  queryType?: QueryType
}
type LogMap = { [id: string]: LogData }

/**
 * Logs table view with focus side panel
 *
 * When in custom data display mode, the side panel will not open when focusing on logs.
 */
const LogTable = ({ data = [], queryType }: Props) => {
  const [focusedLog, setFocusedLog] = useState<LogData | null>(null)
  const columnNames = Object.keys(data[0] || {})
  const hasId = columnNames.includes('id')
  const hasTimestamp = columnNames.includes('timestamp')

  const DEFAULT_COLUMNS = columnNames.map((v) => ({ key: v, name: v, resizable: true }))
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
        columns = DEFAULT_COLUMNS
        break
    }
  }

  const stringData = JSON.stringify(data)
  const logMap = useMemo(() => {
    if (!hasId) return {} as LogMap
    const logData = data as LogData[]
    return logData.reduce((acc: LogMap, d: LogData) => {
      acc[d.id] = d
      return acc
    }, {}) as LogMap
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
      const deduped = [...new Set(data)]
      return deduped
    }
  }, [stringData])

  return (
    <>
      {!queryType && (
        <div
          className="
        w-full bg-scale-300 rounded
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
            <Button type="default" icon={<IconEye />}>
              Histogram
            </Button>
            <Button type="default" icon={<IconDownloadCloud />}>
              Download
            </Button>
          </div>
        </div>
      )}
      <section className="flex flex-1 flex-row" style={{ maxHeight }}>
        <DataGrid
          style={{ height: '100%' }}
          className={`
            flex-grow flex-1
            ${false ? '' : ' data-grid--simple-logs'} 
          `}
          rowHeight={40}
          headerRowHeight={0}
          onSelectedCellChange={({ idx, rowIdx }) => {
            if (!hasId) return
            setFocusedLog(data[rowIdx] as LogData)
          }}
          noRowsFallback={
            <div className="p-4">
              <Typography.Text type="secondary" small className="font-mono">
                No data returned from query
              </Typography.Text>
            </div>
          }
          columns={columns as any}
          rowClass={(r) => {
            const row = r as LogData

            let classes = []
            classes.push(
              `${row.id === focusedLog?.id ? '!bg-scale-400 rdg-row--focussed' : 'cursor-pointer'}`
            )

            return classes.join(' ')
          }}
          rows={logDataRows}
          rowKeyGetter={(r) => {
            if (!hasId) return Object.keys(r)[0]
            const row = r as LogData
            return row.id
          }}
          onRowClick={(r) => {
            // if (!hasLogDataFormat) return
            const row = r as LogData
            setFocusedLog(logMap[row.id])
          }}
        />
        {hasId && focusedLog && (
          <div className="w-1/2 flex flex-col">
            <LogSelection
              onClose={() => setFocusedLog(null)}
              log={focusedLog}
              queryType={queryType}
            />
          </div>
        )}
      </section>
    </>
  )
}
export default LogTable
