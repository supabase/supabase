import dayjs from 'dayjs'
import { Check, Loader2, X } from 'lucide-react'

import { useQueuesMetricsQuery } from 'data/database-queues/database-queues-metrics-query'
import { PostgresQueue } from 'data/database-queues/database-queues-query'
import { useTablesQuery } from 'data/tables/tables-query'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { DATETIME_FORMAT } from 'lib/constants'

export interface QueueWithMetrics extends PostgresQueue {
  id: string // Add unique id for DataGrid
}

interface QueueCellProps {
  queue: QueueWithMetrics
}

export const QueueNameCell = ({ queue }: QueueCellProps) => (
  <div className="flex items-center">
    <span className="truncate" title={queue.queue_name}>
      {queue.queue_name}
    </span>
  </div>
)

export const QueueTypeCell = ({ queue }: QueueCellProps) => {
  const type = queue.is_partitioned ? 'Partitioned' : queue.is_unlogged ? 'Unlogged' : 'Basic'
  return (
    <div className="flex items-center">
      <span className="truncate" title={type.toLowerCase()}>
        {type}
      </span>
    </div>
  )
}

export const QueueRLSCell = ({ queue }: QueueCellProps) => {
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

export const QueueCreatedAtCell = ({ queue }: QueueCellProps) => (
  <div className="flex items-center">
    <span title={queue.created_at}>{dayjs(queue.created_at).format(DATETIME_FORMAT)}</span>
  </div>
)

export const QueueSizeCell = ({ queue }: QueueCellProps) => {
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
