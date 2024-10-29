import dayjs from 'dayjs'
import { includes, sortBy } from 'lodash'
import { Edit3, MoreVertical, Trash } from 'lucide-react'
import Link from 'next/link'

import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import Table from 'components/to-be-cleaned/Table'
import { PostgresQueue } from 'data/database-queues/database-queues-query'
import { DATETIME_FORMAT } from 'lib/constants'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from 'ui'

interface QueuesRowsProps {
  queues: PostgresQueue[]
  filterString: string
  deleteQueue: (fn: PostgresQueue) => void
}

export const QueuesRows = ({
  queues: fetchedQueues,
  filterString,
  deleteQueue,
}: QueuesRowsProps) => {
  const { project: selectedProject } = useProjectContext()

  const filteredQueues = fetchedQueues.filter((x) =>
    includes(x.queue_name.toLowerCase(), filterString.toLowerCase())
  )
  const queues = sortBy(filteredQueues, (func) => func.queue_name.toLocaleLowerCase())

  if (queues.length === 0 && filterString.length > 0) {
    return (
      <Table.tr>
        <Table.td colSpan={4}>
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
      {queues.map((q) => {
        const type = q.is_partitioned ? 'Partitioned' : q.is_unlogged ? 'Unlogged' : 'Regular'

        return (
          <Table.tr key={q.queue_name}>
            <Table.td className="truncate">
              <p title={q.queue_name}>{q.queue_name}</p>
            </Table.td>
            <Table.td className="table-cell overflow-auto">
              <p title={type.toLocaleLowerCase()} className="truncate">
                {type}
              </p>
            </Table.td>
            <Table.td className="table-cell">
              <p title={q.created_at}>{dayjs(q.created_at).format(DATETIME_FORMAT)}</p>
            </Table.td>
            <Table.td className="text-right">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button type="default" className="px-1" icon={<MoreVertical />} />
                </DropdownMenuTrigger>
                <DropdownMenuContent side="left">
                  <Link
                    href={`/project/${selectedProject?.ref}/integrations/queues/${q.queue_name}`}
                  >
                    <DropdownMenuItem className="space-x-2">
                      <Edit3 size={14} />
                      <p>View queue messages</p>
                    </DropdownMenuItem>
                  </Link>
                  <DropdownMenuItem className="space-x-2" onClick={() => deleteQueue(q)}>
                    <Trash stroke="red" size={14} />
                    <p>Delete queue</p>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </Table.td>
          </Table.tr>
        )
      })}
    </>
  )
}
