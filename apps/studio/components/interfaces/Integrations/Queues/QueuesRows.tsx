import dayjs from 'dayjs'
import { includes, sortBy } from 'lodash'
import { ChevronRight, Loader2 } from 'lucide-react'
import { useRouter } from 'next/router'

import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import Table from 'components/to-be-cleaned/Table'
import { useQueuesMetricsQuery } from 'data/database-queues/database-queues-metrics-query'
import { PostgresQueue } from 'data/database-queues/database-queues-query'
import { DATETIME_FORMAT } from 'lib/constants'

interface QueuesRowsProps {
  queues: PostgresQueue[]
  filterString: string
}

const QueueRow = ({ queue }: { queue: PostgresQueue }) => {
  const router = useRouter()
  const { project: selectedProject } = useProjectContext()

  const { data: metrics, isLoading } = useQueuesMetricsQuery(
    {
      queueName: queue.queue_name,
      projectRef: selectedProject?.ref,
      connectionString: selectedProject?.connectionString,
    },
    {
      staleTime: 30 * 1000, // 60 seconds, talk with Oli whether this is ok to call every minute
    }
  )

  const type = queue.is_partitioned ? 'Partitioned' : queue.is_unlogged ? 'Unlogged' : 'Basic'

  return (
    <Table.tr
      key={queue.queue_name}
      onClick={() => {
        router.push(`/project/${selectedProject?.ref}/integrations/queues/${queue.queue_name}`)
      }}
      className="hover:"
    >
      <Table.td className="truncate">
        <p title={queue.queue_name}>{queue.queue_name}</p>
      </Table.td>
      <Table.td className="table-cell overflow-auto">
        <p title={type.toLocaleLowerCase()} className="truncate">
          {type}
        </p>
      </Table.td>
      <Table.td className="table-cell">
        <p title={queue.created_at}>{dayjs(queue.created_at).format(DATETIME_FORMAT)}</p>
      </Table.td>
      <Table.td className="table-cell">
        <div className="flex justify-center">
          {isLoading ? (
            <Loader2 className="animate-spin" size={16} />
          ) : (
            <p>
              {metrics?.queue_length} {metrics?.method === 'estimated' ? '(Approximate)' : null}
            </p>
          )}
        </div>
      </Table.td>
      <Table.td>
        <div className="flex items-center justify-end">
          <ChevronRight size="18" />
        </div>
      </Table.td>
    </Table.tr>
  )
}

export const QueuesRows = ({ queues: fetchedQueues, filterString }: QueuesRowsProps) => {
  const filteredQueues = fetchedQueues.filter((x) =>
    includes(x.queue_name.toLowerCase(), filterString.toLowerCase())
  )
  const queues = sortBy(filteredQueues, (func) => func.queue_name.toLocaleLowerCase())

  if (queues.length === 0 && filterString.length > 0) {
    return (
      <Table.tr>
        <Table.td colSpan={5}>
          <p className="text-sm text-foreground">No results found</p>
          <p className="text-sm text-foreground-light">
            Your search for "{filterString}" did not return any results
          </p>
        </Table.td>
      </Table.tr>
    )
  }

  return (
    <>
      {queues.map((q) => (
        <QueueRow key={q.queue_name} queue={q} />
      ))}
    </>
  )
}
