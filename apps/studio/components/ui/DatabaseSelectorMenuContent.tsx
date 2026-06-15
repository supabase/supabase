import { useParams } from 'common'
import { noop } from 'lodash'
import { Check, Plus } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { parseAsBoolean, useQueryState } from 'nuqs'
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
  ScrollArea,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from 'ui'

import { Markdown } from '@/components/interfaces/Markdown'
import { REPLICA_STATUS } from '@/components/interfaces/Settings/Infrastructure/InfrastructureConfiguration/InstanceConfiguration.constants'
import { useReadReplicasQuery } from '@/data/read-replicas/replicas-query'
import { formatDatabaseID, formatDatabaseRegion } from '@/data/read-replicas/replicas.utils'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'
import { IS_PLATFORM } from '@/lib/constants'
import { useDatabaseSelectorStateSnapshot } from '@/state/database-selector'

interface DatabaseSelectorMenuContentProps {
  selectedDatabaseId?: string
  additionalOptions?: { id: string; name: string }[]
  onSelectId?: (id: string) => void
  onAfterSelect?: () => void
  isForm?: boolean
}

export const DatabaseSelectorMenuContent = ({
  selectedDatabaseId: _selectedDatabaseId,
  additionalOptions = [],
  onSelectId = noop,
  onAfterSelect,
  isForm = false,
}: DatabaseSelectorMenuContentProps) => {
  const router = useRouter()
  const { ref: projectRef } = useParams()
  const [, setShowConnect] = useQueryState('showConnect', parseAsBoolean.withDefault(false))

  const { infrastructureReadReplicas } = useIsFeatureEnabled(['infrastructure:read_replicas'])

  const state = useDatabaseSelectorStateSnapshot()
  const selectedDatabaseId = _selectedDatabaseId ?? state.selectedDatabaseId

  const { data } = useReadReplicasQuery({ projectRef })
  const databases = data ?? []
  const sortedDatabases = databases
    .sort((a, b) => (a.inserted_at > b.inserted_at ? 1 : 0))
    .sort((database) => (database.identifier === projectRef ? -1 : 0))

  const newReplicaURL = `/project/${projectRef}/database/replication?type=Read+Replica`

  const handleSelect = (id: string) => {
    if (!isForm) state.setSelectedDatabaseId(id)
    onAfterSelect?.()
    onSelectId(id)
  }

  return (
    <Command>
      <CommandList>
        {additionalOptions.length > 0 && (
          <CommandGroup className="border-b">
            {additionalOptions.map((option) => (
              <CommandItem
                key={option.id}
                value={option.id}
                className="cursor-pointer w-full"
                onSelect={() => handleSelect(option.id)}
                onClick={() => handleSelect(option.id)}
              >
                <div className="w-full flex items-center justify-between">
                  <p>{option.name}</p>
                  {option.id === selectedDatabaseId && <Check size={14} />}
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        <CommandGroup>
          <ScrollArea className={(databases || []).length > 7 ? 'h-[210px]' : ''}>
            {sortedDatabases?.map((database) => {
              const region = formatDatabaseRegion(database.region)
              const id = formatDatabaseID(database.identifier)

              if (database.status !== 'ACTIVE_HEALTHY') {
                const status = [
                  REPLICA_STATUS.INIT_READ_REPLICA,
                  REPLICA_STATUS.COMING_UP,
                ].includes(database.status)
                  ? 'coming up'
                  : 'not healthy'

                return (
                  <Tooltip key={database.identifier}>
                    <TooltipTrigger asChild>
                      <div className="px-2 py-1.5 w-full flex items-center justify-between">
                        <p className="text-xs text-foreground-lighter">
                          Read replica ({region} - {id})
                        </p>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="w-80">
                      <Markdown
                        className="text-xs text-foreground"
                        content={`Replica unable to accept requests as its ${status}. [View infrastructure settings](/project/${projectRef}/settings/infrastructure) for more information.`}
                      />
                    </TooltipContent>
                  </Tooltip>
                )
              }

              return (
                <CommandItem
                  key={database.identifier}
                  value={database.identifier}
                  className="cursor-pointer w-full"
                  onSelect={() => handleSelect(database.identifier)}
                  onClick={() => handleSelect(database.identifier)}
                >
                  <div className="w-full flex items-center justify-between">
                    <p>
                      {database.identifier === projectRef
                        ? 'Primary'
                        : `Read replica (${region} - ${id})`}
                    </p>
                    {database.identifier === selectedDatabaseId && <Check size={16} />}
                  </div>
                </CommandItem>
              )
            })}
          </ScrollArea>
        </CommandGroup>
        {IS_PLATFORM && infrastructureReadReplicas && (
          <CommandGroup className="border-t">
            <CommandItem
              className="cursor-pointer w-full"
              onSelect={() => {
                onAfterSelect?.()
                router.push(newReplicaURL)
              }}
              onClick={() => onAfterSelect?.()}
            >
              <Link
                href={newReplicaURL}
                onClick={async () => {
                  onAfterSelect?.()
                  setShowConnect(false)
                }}
                className="w-full flex items-center gap-2"
              >
                <Plus size={14} strokeWidth={1.5} />
                <p>Create a new read replica</p>
              </Link>
            </CommandItem>
          </CommandGroup>
        )}
      </CommandList>
    </Command>
  )
}
