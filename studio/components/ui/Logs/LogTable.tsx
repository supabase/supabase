import React, { useEffect, useState } from 'react'
import Table from 'components/to-be-cleaned/Table'
import { Typography, SidePanel } from '@supabase/ui'
import dayjs from 'dayjs'
import { Panel } from '@supabase/ui/dist/cjs/components/Tabs/Tabs'
import LogSelection from './LogSelection'

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

/**
 * Logs table view with focus side panel
 */
const LogTable = ({ data }: Props) => {
  const columns = ["timestamp", "event_message"]

  const [focusedLog, setFocusedLog] = useState<LogData | null>(null);

  if (!data) {
    return null
  }

  if (data === []) {
    return <Typography.Text className="text-center">No data returned from query</Typography.Text>
  }

  return (<section className="flex flex-row gap-x-4">
    <Table containerClassName="mx-auto container overflow-y h-full"
      head={columns.map((c) => <Table.th key={c}>{c}</Table.th>)}
      body={data.map(d =>
        <Table.tr key={d.id}>
          {columns.map(c => <Table.td key={c} className={`${d.id === focusedLog?.id ? "bg-green-800" : ""} `} onClick={() => setFocusedLog(d)}>
            {c === "timestamp" &&
              <Typography.Text className="block bg-green-800" small code>{dayjs(d[c] / 1000).toString()}</Typography.Text>}
            {c === "event_message" && <Typography.Text className="block" small code>{d[c]}</Typography.Text>}
          </Table.td>)}
        </Table.tr>)}
    />
    {focusedLog && (
      <div className="sticky top-0">
        <LogSelection onClose={() => setFocusedLog(null)} log={focusedLog} />
      </div>
    )}
  </section>
  )
}
export default LogTable