import { useFlag, useParams } from 'common'
import { Markdown } from 'components/interfaces/Markdown'
import { REPLICA_STATUS } from 'components/interfaces/Settings/Infrastructure/InfrastructureConfiguration/InstanceConfiguration.constants'
import { useShowNewReplicaPanel } from 'components/interfaces/Settings/Infrastructure/InfrastructureConfiguration/use-show-new-replica'
import { useReadReplicasQuery } from 'data/read-replicas/replicas-query'
import { formatDatabaseID, formatDatabaseRegion } from 'data/read-replicas/replicas.utils'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import { IS_PLATFORM } from 'lib/constants'
import { timeout } from 'lib/helpers'
import { noop } from 'lodash'
import { Check, ChevronDown, Loader2, Plus } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { parseAsBoolean, useQueryState } from 'nuqs'
import { useEffect, useState } from 'react'
import { useDatabaseSelectorStateSnapshot } from 'state/database-selector'
import {
  Button,
  ButtonProps,
  CommandGroup_Shadcn_,
  CommandItem_Shadcn_,
  CommandList_Shadcn_,
  Command_Shadcn_,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
  Popover_Shadcn_,
  ScrollArea,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  cn,
} from 'ui'

interface DatabaseSelectorProps {
  selectedDatabaseId?: string // To override initial state
  variant?: 'regular' | 'connected-on-right' | 'connected-on-left' | 'connected-on-both'
  additionalOptions?: { id: string; name: string }[]
  buttonProps?: ButtonProps
  onSelectId?: (id: string) => void // Optional callback
  className?: string
  align?: 'start' | 'end'
}

export const DatabaseSelector = ({
  selectedDatabaseId: _selectedDatabaseId,
  variant = 'regular',
  additionalOptions = [],
  onSelectId = noop,
  buttonProps,
  align = 'end',
  className,
}: DatabaseSelectorProps) => {
  const router = useRouter()
  const { ref: projectRef } = useParams()
  const [open, setOpen] = useState(false)
  const [, setShowConnect] = useQueryState('showConnect', parseAsBoolean.withDefault(false))
  const { setShowNewReplicaPanel } = useShowNewReplicaPanel()

  const unifiedReplication = useFlag('unifiedReplication')
  const { infrastructureReadReplicas } = useIsFeatureEnabled(['infrastructure:read_replicas'])

  const state = useDatabaseSelectorStateSnapshot()
  const selectedDatabaseId = _selectedDatabaseId ?? state.selectedDatabaseId

  const { data, isPending: isLoading, isSuccess } = useReadReplicasQuery({ projectRef })
  const databases = data ?? []
  const sortedDatabases = databases
    .sort((a, b) => (a.inserted_at > b.inserted_at ? 1 : 0))
    .sort((database) => (database.identifier === projectRef ? -1 : 0))

  const selectedDatabase = databases.find((db) => db.identifier === selectedDatabaseId)
  const selectedDatabaseRegion = formatDatabaseRegion(selectedDatabase?.region ?? '')
  const formattedDatabaseId = formatDatabaseID(selectedDatabaseId ?? '')

  const selectedAdditionalOption = additionalOptions.find((x) => x.id === selectedDatabaseId)

  const newReplicaURL = unifiedReplication
    ? `/project/${projectRef}/database/replication?type=Read+Replica`
    : `/project/${projectRef}/settings/infrastructure`

  useEffect(() => {
    if (_selectedDatabaseId) state.setSelectedDatabaseId(_selectedDatabaseId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [_selectedDatabaseId])

  return (
    <Popover_Shadcn_ open={open} onOpenChange={setOpen} modal={false}>
      <PopoverTrigger_Shadcn_ asChild>
        <div className={cn('flex cursor-pointer', className)}>
          <span className="flex items-center text-foreground-lighter px-3 rounded-lg rounded-r-none text-xs border border-button border-r-0">
            Source
          </span>
          <Button
            type="default"
            icon={isLoading && <Loader2 className="animate-spin" />}
            iconRight={<ChevronDown strokeWidth={1.5} size={12} />}
            {...buttonProps}
            className={cn(
              'pr-2 rounded-l-none',
              variant === 'connected-on-right' && 'rounded-r-none',
              variant === 'connected-on-left' && 'rounded-l-none border-l-0',
              variant === 'connected-on-both' && 'rounded-none border-x-0',
              buttonProps?.className
            )}
          >
            {selectedAdditionalOption ? (
              <span>{selectedAdditionalOption.name}</span>
            ) : (
              <>
                <span className="capitalize">
                  {isLoading || selectedDatabase?.identifier === projectRef
                    ? 'Primary database'
                    : 'Read replica'}
                </span>{' '}
                {isSuccess && selectedDatabase?.identifier !== projectRef && (
                  <span>
                    ({selectedDatabaseRegion} - {formattedDatabaseId})
                  </span>
                )}
              </>
            )}
          </Button>
        </div>
      </PopoverTrigger_Shadcn_>
      <PopoverContent_Shadcn_ className="p-0 w-64" side="bottom" align={align}>
        <Command_Shadcn_>
          <CommandList_Shadcn_>
            {additionalOptions.length > 0 && (
              <CommandGroup_Shadcn_ className="border-b">
                {additionalOptions.map((option) => (
                  <CommandItem_Shadcn_
                    key={option.id}
                    value={option.id}
                    className="cursor-pointer w-full"
                    onSelect={() => {
                      state.setSelectedDatabaseId(option.id)
                      setOpen(false)
                      onSelectId(option.id)
                    }}
                    onClick={() => {
                      state.setSelectedDatabaseId(option.id)
                      setOpen(false)
                      onSelectId(option.id)
                    }}
                  >
                    <div className="w-full flex items-center justify-between">
                      <p>{option.name}</p>
                      {option.id === selectedDatabaseId && <Check size={14} />}
                    </div>
                  </CommandItem_Shadcn_>
                ))}
              </CommandGroup_Shadcn_>
            )}
            <CommandGroup_Shadcn_>
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
                    <CommandItem_Shadcn_
                      key={database.identifier}
                      value={database.identifier}
                      className="cursor-pointer w-full"
                      onSelect={() => {
                        state.setSelectedDatabaseId(database.identifier)
                        setOpen(false)
                        onSelectId(database.identifier)
                      }}
                      onClick={() => {
                        state.setSelectedDatabaseId(database.identifier)
                        setOpen(false)
                        onSelectId(database.identifier)
                      }}
                    >
                      <div className="w-full flex items-center justify-between">
                        <p>
                          {database.identifier === projectRef
                            ? 'Primary database'
                            : `Read replica (${region} - ${id})`}
                        </p>
                        {database.identifier === selectedDatabaseId && <Check size={16} />}
                      </div>
                    </CommandItem_Shadcn_>
                  )
                })}
              </ScrollArea>
            </CommandGroup_Shadcn_>
            {IS_PLATFORM && infrastructureReadReplicas && (
              <CommandGroup_Shadcn_ className="border-t">
                <CommandItem_Shadcn_
                  className="cursor-pointer w-full"
                  onSelect={() => {
                    setOpen(false)
                    router.push(newReplicaURL)
                  }}
                  onClick={() => setOpen(false)}
                >
                  <Link
                    href={newReplicaURL}
                    onClick={async () => {
                      setOpen(false)
                      // [Joshen] This is used in the Connect UI which is available across all pages
                      setShowConnect(false)

                      // [Joshen] Adding a short timeout to compensate for the shift in focus
                      // the replica panel from a "portal" based component (e.g dialog, sheet, dropdown, etc)
                      // Although I'd prefer if there's a better way to resolve this
                      await timeout(50)
                      if (!unifiedReplication) setShowNewReplicaPanel(true)
                    }}
                    className="w-full flex items-center gap-2"
                  >
                    <Plus size={14} strokeWidth={1.5} />
                    <p>Create a new read replica</p>
                  </Link>
                </CommandItem_Shadcn_>
              </CommandGroup_Shadcn_>
            )}
          </CommandList_Shadcn_>
        </Command_Shadcn_>
      </PopoverContent_Shadcn_>
    </Popover_Shadcn_>
  )
}
