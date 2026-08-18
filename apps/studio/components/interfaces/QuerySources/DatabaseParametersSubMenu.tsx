import { useParams } from 'common'
import { Check, Plus } from 'lucide-react'
import Link from 'next/link'
import {
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from 'ui'

import { useReadReplicasQuery } from '@/data/read-replicas/replicas-query'
import { formatDatabaseID, formatDatabaseRegion } from '@/data/read-replicas/replicas.utils'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'

/** The label a database row/summary shows: the primary, or a replica by region + id. */
function databaseLabel(identifier: string, region: string, projectRef: string | undefined) {
  if (identifier === projectRef) return 'Primary database'
  return `Read replica (${formatDatabaseRegion(region)} - ${formatDatabaseID(identifier)})`
}

export const DatabaseParametersSubMenu = ({
  identifier,
  onIdentifierChange,
}: {
  identifier?: string
  onIdentifierChange: (identifier: string) => void
}) => {
  const { ref: projectRef } = useParams()
  const { infrastructureReadReplicas } = useIsFeatureEnabled(['infrastructure:read_replicas'])

  const { data } = useReadReplicasQuery({ projectRef })
  const databases = (data ?? [])
    .slice()
    .sort((a, b) => (a.inserted_at > b.inserted_at ? 1 : 0))
    .sort((database) => (database.identifier === projectRef ? -1 : 0))

  const selectedDatabaseId = identifier ?? projectRef
  const selectedDatabase = databases.find((db) => db.identifier === selectedDatabaseId)

  const newReplicaURL = `/project/${projectRef}/database/replication?destinationType=Read+Replica`

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>
        <div className="flex flex-col">
          <span>Database</span>
          <span className="text-foreground-lighter text-xs">
            {selectedDatabase
              ? databaseLabel(selectedDatabase.identifier, selectedDatabase.region, projectRef)
              : 'Primary database'}
          </span>
        </div>
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent className="w-64">
        {databases.map((database) => {
          const isUnhealthy = database.status !== 'ACTIVE_HEALTHY'
          return (
            <DropdownMenuItem
              key={database.identifier}
              className="justify-between"
              disabled={isUnhealthy}
              onClick={() => onIdentifierChange(database.identifier)}
            >
              <span>{databaseLabel(database.identifier, database.region, projectRef)}</span>
              {database.identifier === selectedDatabaseId && <Check size={14} />}
            </DropdownMenuItem>
          )
        })}
        {infrastructureReadReplicas && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className="gap-x-2">
              <Link href={newReplicaURL}>
                <Plus size={14} strokeWidth={1.5} />
                Create a new read replica
              </Link>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  )
}
