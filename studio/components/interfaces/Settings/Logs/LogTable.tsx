import dayjs from 'dayjs'
import { useEffect, useState, useMemo } from 'react'
import { Badge, Button, IconDownload, IconDownloadCloud, IconEye, Typography } from '@supabase/ui'
import DataGrid, { Row } from '@supabase/react-data-grid'

import LogSelection from './LogSelection'
import { LogData, Mode, QueryType } from './Logs.types'
import { isNil } from 'lodash'
import { SeverityFormatter, ResponseCodeFormatter, HeaderFormmater } from './LogsFormatters'

// column renders
import DatabaseApiColumnRender from './LogColumnRenderers/DatabaseApiColumnRender'
import DatabasePostgresColumnRender from './LogColumnRenderers/DatabasePostgresColumnRender'

interface Props {
  isCustomQuery: boolean
  data?: Array<LogData | Object>
  queryType: QueryType
}
type LogMap = { [id: string]: LogData }

/**
 * Logs table view with focus side panel
 *
 * When in custom data display mode, the side panel will not open when focusing on logs.
 */
const LogTable = ({ isCustomQuery, data = [], queryType }: Props) => {
  const [focusedLog, setFocusedLog] = useState<LogData | null>(null)
  const columnNames = Object.keys(data[0] || {})

  // console.log('queryType', queryType)

  // console.log('focusedLog', focusedLog)

  isCustomQuery = false

  // whether the data structure is LogData format.
  // const hasLogDataFormat =
  //   columnNames.includes('timestamp') &&
  //   columnNames.includes('event_message') &&
  //   columnNames.length === 4

  const hasLogDataFormat = !isCustomQuery

  const DEFAULT_COLUMNS = (hasLogDataFormat ? ['timestamp', 'event_message'] : columnNames).map(
    (v) => ({
      key: v,
      name: v,
      // width: hasLogDataFormat && v === 'timestamp' ? 210 : undefined,
      resizable: true,
      // headerRenderer: () => {
      //   return <div className="flex items-center text-xs font-mono h-full">{v}</div>
      // },
      // formatter: ({ row }: any) => {
      //   let value = row[v]
      //   if (hasLogDataFormat && v === 'timestamp') {
      //     value = dayjs(Number(row['timestamp']) / 1000).toISOString()
      //   }
      //   return (
      //     <p
      //       className={[
      //         'block whitespace-wrap font-mono',
      //         `${hasLogDataFormat && row.id === focusedLog?.id ? 'font-bold' : ''}`,
      //         `${hasLogDataFormat && v === 'timestamp' ? 'text-green-900' : ''}`,
      //       ].join(' ')}
      //     >
      //       {value}
      //     </p>
      //   )
      // },
    })
  )

  let columns

  // console.log('QUERY TYPE', queryType)

  switch (queryType) {
    case 'api':
      if (isCustomQuery) {
        columns = DEFAULT_COLUMNS
        break
      }

      // console.log('is api, running column')
      columns = DatabaseApiColumnRender

      break

    case 'database':
      if (isCustomQuery) {
        columns = DEFAULT_COLUMNS
        break
      }

      // console.log('is api, running column')
      columns = DatabasePostgresColumnRender

      break

    case 'fn_edge':
      if (isCustomQuery) {
        columns = DEFAULT_COLUMNS
        break
      }

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
              <span className="text-xs">{dayjs(data?.row?.timestamp / 1000).format('DD MMM')}</span>
              <span className="text-xs">
                {dayjs(data?.row?.timestamp / 1000).format('HH:mm:ss')}
              </span>
              {/* {data?.row?.timestamp} */}
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
      if (isCustomQuery) {
        columns = DEFAULT_COLUMNS
        break
      }
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
              {/* {data?.row?.timestamp} */}
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

  const logMap = useMemo(() => {
    if (!hasLogDataFormat) return {} as LogMap
    const logData = data as LogData[]
    return logData.reduce((acc: LogMap, d: LogData) => {
      acc[d.id] = d
      return acc
    }, {}) as LogMap
  }, [JSON.stringify(data)])

  const stringData = JSON.stringify(data)
  useEffect(() => {
    if (!hasLogDataFormat) return
    if (isNil(data)) return
    if (focusedLog && !(focusedLog.id in logMap)) {
      setFocusedLog(null)
    }
  }, [stringData])

  if (!data) return null

  // console.log(data)
  // console.log('logMap', logMap)
  // console.log(columns)

  // [Joshen] Hmm quite hacky now, but will do
  const maxHeight = isCustomQuery ? 'calc(100vh - 42px - 10rem)' : 'calc(100vh - 42px - 3rem)'

  const logDataRows = useMemo(() => {
    if (!hasLogDataFormat) return data
    return Object.values(logMap).sort((a, b) => b.timestamp - a.timestamp)
  }, [stringData])
  return (
    <>
      {isCustomQuery && (
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
            ${isCustomQuery ? '' : ' data-grid--simple-logs'} 
          `}
          rowHeight={40}
          headerRowHeight={0}
          onSelectedCellChange={({ idx, rowIdx }) => {
            if (!hasLogDataFormat) return
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
            // if (!hasLogDataFormat) return 'cursor-pointer'
            const row = r as LogData

            let classes = []

            //@ts-ignore
            // if (row.status_code) {
            //   const response = parseResponseCode(row.status_code)
            //   if (response == 'warning') {
            //     classes.push('!bg-yellow-200 !dark:bg-yellow-100')
            //   }
            //   if (response == 'error') {
            //     classes.push('!bg-red-200')
            //   }
            // }

            classes.push(
              `${row.id === focusedLog?.id ? '!bg-scale-400 rdg-row--focussed' : 'cursor-pointer'}`
            )

            return classes.join(' ')
          }}
          rows={logDataRows}
          rowKeyGetter={(r) => {
            if (!hasLogDataFormat) return Object.keys(r)[0]
            const row = r as LogData
            return row.id
          }}
          onRowClick={(r) => {
            // if (!hasLogDataFormat) return
            const row = r as LogData
            setFocusedLog(logMap[row.id])
          }}
        />
        {/* {hasLogDataFormat ||
          (focusedLog && ( */}
        <div className="w-1/2 flex flex-col">
          <LogSelection
            onClose={() => setFocusedLog(null)}
            log={focusedLog}
            queryType={queryType}
          />
        </div>
        {/* ))} */}
      </section>
    </>
  )
}
export default LogTable
