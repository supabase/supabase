import { useLogDrainsQuery } from 'data/log-drains/log-drains-query'
import { useProjectAddonsQuery } from 'data/subscriptions/project-addons-query'
import Link from 'next/link'
import { LOG_DRAIN_SOURCES, LogDrainSource } from './LogDrains.constants'
import { useParams } from 'common'
import CardButton from 'components/ui/CardButton'
import Panel from 'components/ui/Panel'
import { GenericSkeletonLoader } from 'ui-patterns'
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from 'ui'

export function LogDrains({ onNewDrainClick }: { onNewDrainClick: (src: LogDrainSource) => void }) {
  const { ref } = useParams()
  const { data: logDrains, isLoading } = useLogDrainsQuery({ ref })

  if (isLoading) {
    return (
      <div>
        <GenericSkeletonLoader />
      </div>
    )
  }

  if (!isLoading && logDrains?.length === 0) {
    return (
      <div className="grid grid-cols-2 gap-3">
        {LOG_DRAIN_SOURCES.map((src) => (
          <CardButton
            key={src.value}
            title={src.name}
            description={src.description}
            icon={src.icon}
            onClick={() => {
              onNewDrainClick(src.value)
            }}
          />
        ))}
      </div>
    )
  }

  return (
    <>
      <Panel className="">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Name</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Inserted At</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logDrains?.map((drain) => (
              <TableRow key={drain.id}>
                <TableCell className="font-medium">{drain.name}</TableCell>
                <TableCell>{drain.source}</TableCell>
                <TableCell>{new Date(drain.inserted_at).toLocaleString()}</TableCell>
                <TableCell className="text-right">
                  <Link href={`/project/${ref}/settings/log-drains/${drain.id}`}>View</Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Panel>
    </>
  )
}
