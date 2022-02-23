import dayjs from 'dayjs'
import { FC } from 'react'
import { Typography, IconX, Button, IconCopy } from '@supabase/ui'
import { copyToClipboard } from 'lib/helpers'

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
            <Typography.Text small>Event message</Typography.Text>
            <Typography.Text code className="block w-full overflow-x-auto" small>
              {log.event_message}{' '}
            </Typography.Text>
            <div className="flex flex-row justify-end">
              <Button
                size="tiny"
                type="default"
                onClick={() => {
                  copyToClipboard(String(log.event_message))
                }}
                icon={<IconCopy size={14}/>}
              >
                Copy
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Typography.Text small>Metadata</Typography.Text>

            <Typography.Text
              code
              style={{ maxHeight: '30rem' }}
              className="block whitespace-pre w-full overflow-auto"
              small
            >
              {JSON.stringify(log.metadata, null, 2)}
            </Typography.Text>
            <div className="flex flex-row justify-end">
              <Button
                size="tiny"
                type="default"
                onClick={() => {
                  copyToClipboard(String(log.metadata))
                }}
                icon={<IconCopy size={14}/>}

              >
                Copy
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LogSelection
