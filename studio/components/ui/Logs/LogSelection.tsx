import React from 'react'
import { Button, Input, Typography } from '@supabase/ui'
import Panel from 'components/to-be-cleaned/Panel'
import { LogData } from "./LogTable"
import dayjs from 'dayjs'

interface Props {
  log: LogData
  onClose: () => void
}

/**
 * Log selection display
 */
const LogSelection = ({ log, onClose }: Props) => (
  <Panel
    title={
      <div className="flex flex-row justify-between items-center w-full">
        <Typography.Title level={5}>{dayjs(log.timestamp / 1000).toString()}</Typography.Title>
        <Button size="tiny" type="secondary" onClick={onClose}>Close</Button>
      </div>
    }
  >
    <div className="p-4 h-full flex-col">
      <Typography.Text code className="block w-full overflow-x-auto" small>{log.event_message} </Typography.Text>
      <Input.TextArea label="Metadata" className="font-mono mt-4" size="tiny" rows={25} disabled value={JSON.stringify(log.metadata, null, 2)} />
    </div>


  </Panel>
)
export default LogSelection