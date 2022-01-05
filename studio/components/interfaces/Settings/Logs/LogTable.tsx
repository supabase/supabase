import dayjs from 'dayjs'
import { useEffect, useState, useMemo } from 'react'
import { Typography } from '@supabase/ui'
import DataGrid from '@supabase/react-data-grid'

import LogSelection from './LogSelection'
import { LogData } from './Logs.types'
import { isNil } from 'lodash'

interface Props {
  isCustomQuery: boolean
  data?: LogData[]
}

/**
 * Logs table view with focus side panel
 */
const LogTable = ({ isCustomQuery, data }: Props) => {
  const [focusedLog, setFocusedLog] = useState<LogData | null>(null)
  const columns = ['timestamp', 'event_message'].map((v) => ({
    key: v,
    name: v,
    width: v === 'timestamp' ? 210 : undefined,
    resizable: true,
    headerRenderer: () => {
      return <div className="flex items-center text-xs font-mono h-full">{v}</div>
    },
    formatter: ({ row }: any) => {
      let value = row[v]
      if (v === 'timestamp') {
        value = dayjs(Number(row['timestamp']) / 1000).toISOString()
      }
      return (
        <p
          className={[
            'block whitespace-wrap font-mono',
            `${row.id === focusedLog?.id ? 'font-bold' : ''}`,
            `${v === 'timestamp' ? 'text-green-500' : ''}`,
          ].join(' ')}
        >
          {value}
        </p>
      )
    },
  }))

  const logMap: { [id: string]: LogData } = useMemo(() => {
    return (data || []).reduce((acc: any, d) => {
      acc[d.id] = d
      return acc
    }, {})
  }, [JSON.stringify(data)])

  const strLogMap = JSON.stringify(logMap)
  useEffect(() => {
    if (isNil(data)) return
    if (focusedLog && !(focusedLog.id in logMap)) {
      setFocusedLog(null)
    }
  }, [strLogMap])

  if (!data) return null

  // [Joshen] Hmm quite hacky now, but will do
  const maxHeight = isCustomQuery ? 'calc(100vh - 42px - 10rem)' : 'calc(100vh - 42px - 3rem)'

  const logDataRows = useMemo(() => {
    // sort in timestamp descending order
    return Object.values(logMap).sort((a, b) => b.timestamp - a.timestamp)
  }, [strLogMap])
  return (
    <section className="flex flex-1 flex-row" style={{ maxHeight }}>
      <DataGrid
        style={{ height: '100%' }}
        className="flex-grow flex-1"
        onSelectedCellChange={({ idx, rowIdx }) => setFocusedLog(data[rowIdx])}
        noRowsFallback={
          <div className="p-4">
            <Typography.Text type="secondary" small className="font-mono">
              No data returned from query
            </Typography.Text>
          </div>
        }
        columns={columns as any}
        rowClass={(r) => `${r.id === focusedLog?.id ? 'bg-green-800' : 'cursor-pointer'}`}
        rows={logDataRows}
        rowKeyGetter={(r) => r.id}
        onRowClick={(r) => setFocusedLog(logMap[r.id])}
      />
      {focusedLog && (
        <div className="w-2/5 flex flex-col">
          <LogSelection onClose={() => setFocusedLog(null)} log={focusedLog} />
        </div>
      )}
    </section>
  )
}
export default LogTable
