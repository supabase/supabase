import React from 'react'
import Table from 'components/to-be-cleaned/Table'
import { Tab } from '@headlessui/react'
import { Typography } from '@supabase/ui'

interface Props {
  data: LogData[] | null
}

interface LogData extends LogDataCommon {
  [key: string]: string | number
}
interface LogDataCommon {
  timestamp: number
  event_message: string
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
      head={columns.map(c => <Table.th>{c}</Table.th>)}
      body={data.map(d => (
        <Table.tr>
          {columns.map(c => <Table.td>{d[c]}</Table.td>)}
        </Table.tr>))}
    />
  )
}
export default LogTable