import React from 'react'
import Table from 'components/to-be-cleaned/Table'
import { Typography } from '@supabase/ui'
import dayjs from 'dayjs'

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
 * Logs table view
 */
const LogTable = ({ data }: Props) => {
  const columns = ["timestamp", "event_message"]

  if (!data) {
    return null
  }

  if (data === []) {
    return <Typography.Text className="text-center">No data returned from query</Typography.Text>
  }

  return (
    <Table containerClassName="mx-auto container"
      head={columns.map((c) => <Table.th key={c}>{c}</Table.th>)}
      body={data.map(d =>
        <Table.tr key={d.id}>
          {columns.map(c => <Table.td key={c} >
            {c === "timestamp" &&
              <Typography.Text className="block bg-green-800" code>{dayjs(d[c] / 1000).toString()}</Typography.Text>}
            {c === "event_message" && <Typography.Text className="block" code>{d[c]}</Typography.Text>}
          </Table.td>)}
        </Table.tr>)}
    />
  )
}
export default LogTable