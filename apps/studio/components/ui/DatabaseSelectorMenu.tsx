import { useParams } from 'common'
import { noop } from 'lodash'
import { Check, Plus } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { parseAsBoolean, useQueryState } from 'nuqs'
import { useEffect } from 'react'
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
  DropdownMenuItem,
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

export interface DatabaseSelectorMenuProps {
  selectedDatabaseId?: string
  additionalOptions?: { id: string; name: string }[]
  onSelectId?: (id: string) => void
  isForm?: boolean
  /** When true, renders items for use inside DropdownMenuSubContent */
  asDropdownItems?: boolean
  onAfterSelect?: () => void
}

export const DatabaseSelectorMenu = ({
  selectedDatabaseId: _selectedDatabaseId,
  additionalOptions = [],
  onSelectId = noop,
  isForm = false,
  asDropdownItems = false,
  onAfterSelect,
}: DatabaseSelectorMenuProps) => {
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

  useEffect(() => {
    if (_selectedDatabaseId && !isForm) state.setSelectedDatabaseId(_selectedDatabaseId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [_selectedDatabaseId])

  const handleSelect = (databaseIdentifier: string) => {
    if (!isForm) state.setSelectedDatabaseId(databaseIdentifier)
    onSelectId(databaseIdentifier)
    onAfterSelect?.()
  }

  const renderDatabaseItem = (database: (typeof databases)[number]) => {
    const region = formatDatabaseRegion(database.region)
    const id = formatDatabaseID(database.identifier)
    const label =
      database.identifier === projectRef ? 'Primary database' : `Read replica (${region} - ${id})`

    if (database.status !== 'ACTIVE_HEALTHY') {
      const status = [REPLICA_STATUS.INIT_READ_REPLICA, REPLICA_STATUS.COMING_UP].includes(
        database.status
      )
        ? 'coming up'
        : 'not healthy'

      if (asDropdownItems) {
        return (
          <Tooltip key={database.identifier}>
            <TooltipTrigger asChild>
              <DropdownMenuItem disabled className="text-foreground-lighter text-xs">
                {label}
              </DropdownMenuItem>
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
        <Tooltip key={database.identifier}>
          <TooltipTrigger asChild>
            <div className="px-2 py-1.5 w-full flex items-center justify-between">
              <p className="text-xs text-foreground-lighter">{label}</p>
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

    const isSelected = database.identifier === selectedDatabaseId

    if (asDropdownItems) {
      return (
        <DropdownMenuItem
          key={database.identifier}
          className="justify-between"
          onClick={() => handleSelect(database.identifier)}
        >
          <span>{label}</span>
          {isSelected && <Check size={14} />}
        </DropdownMenuItem>
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
          <p>{label}</p>
          {isSelected && <Check size={16} />}
        </div>
      </CommandItem>
    )
  }

  const additionalOptionItems = additionalOptions.map((option) => {
    const isSelected = option.id === selectedDatabaseId

    if (asDropdownItems) {
      return (
        <DropdownMenuItem
          key={option.id}
          className="justify-between"
          onClick={() => handleSelect(option.id)}
        >
          <span>{option.name}</span>
          {isSelected && <Check size={14} />}
        </DropdownMenuItem>
      )
    }

    return (
      <CommandItem
        key={option.id}
        value={option.id}
        className="cursor-pointer w-full"
        onSelect={() => handleSelect(option.id)}
        onClick={() => handleSelect(option.id)}
      >
        <div className="w-full flex items-center justify-between">
          <p>{option.name}</p>
          {isSelected && <Check size={14} />}
        </div>
      </CommandItem>
    )
  })

  const createReplicaItem =
    IS_PLATFORM && infrastructureReadReplicas ? (
      asDropdownItems ? (
        <DropdownMenuItem asChild key="create-replica">
          <Link
            href={newReplicaURL}
            onClick={() => {
              onAfterSelect?.()
              setShowConnect(false)
            }}
            className="flex items-center gap-2"
          >
            <Plus size={14} strokeWidth={1.5} />
            <span>Create a new read replica</span>
          </Link>
        </DropdownMenuItem>
      ) : (
        <CommandItem
          key="create-replica"
          className="cursor-pointer w-full"
          onSelect={() => {
            onAfterSelect?.()
            router.push(newReplicaURL)
          }}
          onClick={() => onAfterSelect?.()}
        >
          <Link
            href={newReplicaURL}
            onClick={() => setShowConnect(false)}
            className="w-full flex items-center gap-2"
          >
            <Plus size={14} strokeWidth={1.5} />
            <p>Create a new read replica</p>
          </Link>
        </CommandItem>
      )
    ) : null

  if (asDropdownItems) {
    return (
      <>
        {additionalOptionItems}
        {additionalOptions.length > 0 && sortedDatabases.length > 0 && (
          <div className="my-1 h-px bg-border" />
        )}
        {sortedDatabases.map(renderDatabaseItem)}
        {createReplicaItem}
      </>
    )
  }

  return (
    <Command>
      <CommandList>
        {additionalOptions.length > 0 && (
          <CommandGroup className="border-b">{additionalOptionItems}</CommandGroup>
        )}
        <CommandGroup>
          <ScrollArea className={(databases || []).length > 7 ? 'h-[210px]' : ''}>
            {sortedDatabases.map(renderDatabaseItem)}
          </ScrollArea>
        </CommandGroup>
        {createReplicaItem ? (
          <CommandGroup className="border-t">{createReplicaItem}</CommandGroup>
        ) : null}
      </CommandList>
    </Command>
  )
}

export function useDatabaseSelectorLabel(selectedDatabaseId?: string) {
  const { ref: projectRef } = useParams()
  const state = useDatabaseSelectorStateSnapshot()
  const resolvedId = selectedDatabaseId ?? state.selectedDatabaseId

  const { data, isSuccess } = useReadReplicasQuery({ projectRef })
  const databases = data ?? []
  const selectedDatabase = databases.find((db) => db.identifier === resolvedId)
  const selectedDatabaseRegion = formatDatabaseRegion(selectedDatabase?.region ?? '')
  const formattedDatabaseId = formatDatabaseID(resolvedId ?? '')

  if (!isSuccess || selectedDatabase?.identifier === projectRef) {
    return 'Primary database'
  }

  return `Read replica (${selectedDatabaseRegion} - ${formattedDatabaseId})`
}
