import { Column } from '@supabase/react-data-grid'
import { IconAlertCircle, IconBroadcast, IconDatabaseChanges, IconPresence } from 'ui'

import { LogData, PreviewLogData } from './Events.types'
import { RowLayout } from './EventsFormatters'
import { isErrorLog } from './EventsTable'

const ICONS = {
  PRESENCE: <IconPresence size="xlarge" className="bg-brand-400 rounded" />,
  BROADCAST: <IconBroadcast size="xlarge" className="bg-brand-400 rounded" />,
  POSTGRES: <IconDatabaseChanges size="xlarge" className="bg-brand-400 rounded" />,
  SYSTEM: <IconDatabaseChanges size="xlarge" className="bg-brand-400 rounded" />,
}

export const ColumnRenderer: Column<LogData, unknown>[] = [
  {
    name: 'timestamp-with-truncated-text',
    key: 'main-column',
    formatter: (data: { row: PreviewLogData }) => {
      const isError = isErrorLog(data.row)
      const type = data.row.event_message as keyof typeof ICONS

      return (
        <RowLayout>
          {isError ? (
            <div>
              <IconAlertCircle
                strokeWidth={2}
                size="xlarge"
                className="p-1 rounded text-warning-300 bg-warning-600"
              />
            </div>
          ) : (
            <div className="w-6 flex-shrink-0" />
          )}
          <div>{ICONS[type]}</div>
          <span className="font-mono">{new Date(data.row.timestamp).toISOString()}</span>
          <span className="truncate font-mono">{JSON.stringify(data.row.metadata)}</span>
        </RowLayout>
      )
    },
  },
]
