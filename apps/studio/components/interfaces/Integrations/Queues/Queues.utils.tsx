import dayjs from 'dayjs'
import { Check, Loader2, X } from 'lucide-react'
import { Column } from 'react-data-grid'

import { useQueuesMetricsQuery } from 'data/database-queues/database-queues-metrics-query'
import { PostgresQueue } from 'data/database-queues/database-queues-query'
import { useTablesQuery } from 'data/tables/tables-query'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { DATETIME_FORMAT } from 'lib/constants'
import { cn } from 'ui'

interface QueueWithMetrics extends PostgresQueue {
  id: string // Add unique id for DataGrid
}

interface QueueCellProps {
  queue: QueueWithMetrics
}

const QueueNameCell = ({ queue }: QueueCellProps) => (
  <div className="flex items-center">
    <span className="truncate" title={queue.queue_name}>
      {queue.queue_name}
    </span>
  </div>
)

const QueueTypeCell = ({ queue }: QueueCellProps) => {
  const type = queue.is_partitioned ? 'Partitioned' : queue.is_unlogged ? 'Unlogged' : 'Basic'
  return (
    <div className="flex items-center">
      <span className="truncate" title={type.toLowerCase()}>
        {type}
      </span>
    </div>
  )
}

const QueueRLSCell = ({ queue }: QueueCellProps) => {
  const { data: selectedProject } = useSelectedProjectQuery()

  const { data: queueTables } = useTablesQuery({
    projectRef: selectedProject?.ref,
    connectionString: selectedProject?.connectionString,
    schema: 'pgmq',
  })

  const queueTable = queueTables?.find((x) => x.name === `q_${queue.queue_name}`)
  const isRlsEnabled = !!queueTable?.rls_enabled

  return (
    <div className="flex items-center">
      {isRlsEnabled ? <Check size={14} className="text-brand" /> : <X size={14} />}
    </div>
  )
}

const QueueCreatedAtCell = ({ queue }: QueueCellProps) => (
  <div className="flex items-center">
    <span title={queue.created_at}>{dayjs(queue.created_at).format(DATETIME_FORMAT)}</span>
  </div>
)

const QueueSizeCell = ({ queue }: QueueCellProps) => {
  const { data: selectedProject } = useSelectedProjectQuery()

  const { data: metrics, isLoading } = useQueuesMetricsQuery(
    {
      queueName: queue.queue_name,
      projectRef: selectedProject?.ref,
      connectionString: selectedProject?.connectionString,
    },
    {
      staleTime: 30 * 1000, // 30 seconds
    }
  )

  return (
    <div className="flex items-center">
      {isLoading ? (
        <Loader2 className="animate-spin" size={16} />
      ) : (
        <span>
          {metrics?.queue_length} {metrics?.method === 'estimated' ? '(Approximate)' : null}
        </span>
      )}
    </div>
  )
}

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
