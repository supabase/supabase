import { Column } from 'react-data-grid'

import { PostgresQueue } from 'data/database-queues/database-queues-query'
import { cn } from 'ui'
import {
  QueueCreatedAtCell,
  QueueNameCell,
  QueueRLSCell,
  QueueSizeCell,
  QueueTypeCell,
  QueueWithMetrics,
} from './QueueCells'

export const formatQueueColumns = (): Column<QueueWithMetrics>[] => {
  return [
    {
      key: 'queue_name',
      name: 'Name',
      resizable: true,
      minWidth: 200,
      headerCellClass: undefined,
      renderHeaderCell: () => {
        return (
          <div className={cn('flex items-center justify-between font-normal text-xs w-full ml-8')}>
            <p className="!text-foreground">Name</p>
          </div>
        )
      },
      renderCell: (props) => {
        return <QueueNameCell queue={props.row} />
      },
    },
    {
      key: 'type',
      name: 'Type',
      resizable: true,
      minWidth: 120,
      headerCellClass: undefined,
      renderHeaderCell: () => {
        return (
          <div className={cn('flex items-center justify-between font-normal text-xs w-full')}>
            <p className="!text-foreground">Type</p>
          </div>
        )
      },
      renderCell: (props) => {
        return <QueueTypeCell queue={props.row} />
      },
    },
    {
      key: 'rls_enabled',
      name: 'RLS enabled',
      resizable: true,
      minWidth: 120,
      headerCellClass: undefined,
      renderHeaderCell: () => {
        return (
          <div className={cn('flex items-center justify-between font-normal text-xs w-full')}>
            <p className="!text-foreground">RLS enabled</p>
          </div>
        )
      },
      renderCell: (props) => {
        return <QueueRLSCell queue={props.row} />
      },
    },
    {
      key: 'created_at',
      name: 'Created at',
      resizable: true,
      minWidth: 180,
      headerCellClass: undefined,
      renderHeaderCell: () => {
        return (
          <div className={cn('flex items-center justify-between font-normal text-xs w-full')}>
            <p className="!text-foreground">Created at</p>
          </div>
        )
      },
      renderCell: (props) => {
        return <QueueCreatedAtCell queue={props.row} />
      },
    },
    {
      key: 'queue_size',
      name: 'Size',
      resizable: true,
      minWidth: 120,
      headerCellClass: undefined,
      renderHeaderCell: () => {
        return (
          <div className={cn('flex items-center justify-between font-normal text-xs w-full')}>
            <p className="!text-foreground">Size</p>
          </div>
        )
      },
      renderCell: (props) => {
        return <QueueSizeCell queue={props.row} />
      },
    },
  ]
}

export const prepareQueuesForDataGrid = (queues: PostgresQueue[]): QueueWithMetrics[] => {
  return queues.map((queue) => ({
    ...queue,
    id: queue.queue_name, // Use queue_name as unique id
  }))
}
