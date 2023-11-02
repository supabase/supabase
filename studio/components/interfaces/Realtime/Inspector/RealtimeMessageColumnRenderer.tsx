import { Column } from 'react-data-grid'
import { IconBroadcast, IconDatabaseChanges, IconPresence } from 'ui'

import { LogData, PreviewLogData } from './Messages.types'
import { RowLayout } from './MessagesFormatters'

const ICONS = {
  PRESENCE: <IconPresence size="xlarge" className="bg-brand-400 rounded text-brand-600" />,
  BROADCAST: <IconBroadcast size="xlarge" className="bg-brand-400 rounded text-brand-600" />,
  POSTGRES: <IconDatabaseChanges size="xlarge" className="bg-brand-400 rounded text-brand-600" />,
  SYSTEM: <IconDatabaseChanges size="xlarge" className="bg-brand-400 rounded text-brand-600" />,
}

export const ColumnRenderer: Column<LogData, unknown>[] = [
  {
    name: 'timestamp-with-truncated-text',
    key: 'main-column',
    renderCell: (data: { row: PreviewLogData }) => {
      const type = data.row.message as keyof typeof ICONS

      return (
        <RowLayout>
          <div>{ICONS[type]}</div>
          <span className="font-mono">{new Date(data.row.timestamp).toISOString()}</span>
          <span className="truncate font-mono">{JSON.stringify(data.row.metadata)}</span>
        </RowLayout>
      )
    },
  },
]
