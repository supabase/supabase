import dayjs from 'dayjs'
import { FC } from 'react'
import { Typography, IconX, Input } from '@supabase/ui'

import { LogData } from './Logs.types'

interface Props {
  log: LogData
  onClose: () => void
}

/**
 * Log selection display
 */
const LogSelection: FC<Props> = ({ log, onClose }) => {
  return (
    <div
      className={[
        'h-full flex flex-col flex-grow border border-l-0',
        'border-panel-border-light dark:border-panel-border-dark',
      ].join(' ')}
    >
      <div
        className={[
          'bg-panel-header-light dark:bg-panel-header-dark',
          'border-b border-panel-border-interior-light',
          'dark:border-panel-border-interior-dark',
        ].join(' ')}
      >
        <div className="px-6 py-4 flex items-center">
          <div className="flex flex-row justify-between items-center w-full">
            <Typography.Title level={5}>{dayjs(log.timestamp / 1000).toString()}</Typography.Title>
            <div className="cursor-pointer" onClick={onClose}>
              <IconX size={14} />
            </div>
          </div>
        </div>
      </div>
      <div className="flex-grow overflow-y-auto bg-panel-body-light dark:bg-panel-body-dark">
        <div className="p-4 flex-col space-y-4">
          <div className="space-y-2">
            <p className="text-sm">Event message</p>
            <Input
              copy
              readOnly
              size="small"
              layout="vertical"
              className="text-sm input-mono"
              value={log.event_message}
            />
          </div>
          <div className="space-y-2">
            <p className="text-sm">Metadata</p>
            <Input.TextArea
              copy
              readOnly
              size="small"
              layout="vertical"
              rows={20}
              className="input-mono"
              value={JSON.stringify(log.metadata, null, 2)}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default LogSelection
