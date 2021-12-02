import React, { useEffect, useState } from 'react'
import { Typography } from '@supabase/ui'
import dayjs from 'dayjs'
import LogSelection from './LogSelection'
import DataGrid from '@supabase/react-data-grid'
interface Props {
  data: LogData[] | null | undefined
}

interface Metadata {
  [key: string]: string | number | Object | Object[]
}
export interface LogData {
  id: string
  timestamp: number
  event_message: string
  metadata: Metadata
}

interface Column {
  key: string
  name: string
}

/**
 * Logs table view with focus side panel
 */
const LogTable = ({ data }: Props) => {
  const [focusedLog, setFocusedLog] = useState<LogData | null>(null);
  const columns = ["timestamp", "event_message"].map(v => ({
    key: v, name: v,
    width: v === "timestamp" ? 240 : undefined,
    resizable: true,
    headerRenderer: () => {
      return <div className="flex items-center justify-center font-mono h-full">{v}</div>
    },
    formatter: ({ row }: any) => {
      let value = row[v]
      if (v === 'timestamp') {
        value = dayjs(Number(row["timestamp"]) / 1000).toString()
      }
      return <p className={`block whitespace-line-wrap ${row.id === focusedLog?.id ? "font-bold" : ""}`}>{value}</p>
    }
  }))

  const logMap = (data || []).reduce((acc: any, d) => {
    acc[d.id] = d
    return acc
  }, {})
  useEffect(() => {
    if (!data) return
    if (focusedLog && !(focusedLog.id in logMap)) {
      setFocusedLog(null)
    }
  }, [Object.keys(logMap)])

  if (!data) return null

  return (<section className="flex flex-row gap-x-4">
    <DataGrid
      style={{ height: "unset", minHeight: "75vh" }}
      className="flex-grow flex-1"
      onSelectedCellChange={({ idx, rowIdx }) => setFocusedLog(data[rowIdx])}
      noRowsFallback={<Typography.Text className="text-center">No data returned from query</Typography.Text>}
      columns={columns as any}
      rowClass={r => `${r.id === focusedLog?.id ? "bg-green-800" : "cursor-pointer"}`}
      rows={data}
      rowKeyGetter={r => r.id}
      onRowClick={r => setFocusedLog(logMap[r.id])}
    />
    {focusedLog && (
      <div className="w-2/5">
        <LogSelection onClose={() => setFocusedLog(null)} log={focusedLog} />
      </div>
    )}
  </section>
  )
}
export default LogTable