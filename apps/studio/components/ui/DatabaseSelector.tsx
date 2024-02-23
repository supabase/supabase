import { useParams } from 'common'
import { noop } from 'lodash'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState } from 'react'
import {
  Button,
  CommandGroup_Shadcn_,
  CommandItem_Shadcn_,
  CommandList_Shadcn_,
  Command_Shadcn_,
  IconCheck,
  IconChevronDown,
  IconLoader,
  IconPlus,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
  Popover_Shadcn_,
  ScrollArea,
  cn,
} from 'ui'

import { useReadReplicasQuery } from 'data/read-replicas/replicas-query'
import { formatDatabaseID, formatDatabaseRegion } from 'data/read-replicas/replicas.utils'
import { useDatabaseSelectorStateSnapshot } from 'state/database-selector'

interface DatabaseSelectorProps {
  variant?: 'regular' | 'connected-on-right' | 'connected-on-left' | 'connected-on-both'
  additionalOptions?: { id: string; name: string }[]
  onSelectId?: (id: string) => void // Optional callback
}

const DatabaseSelector = ({
  variant = 'regular',
  additionalOptions = [],
  onSelectId = noop,
}: DatabaseSelectorProps) => {
  const router = useRouter()
  const { ref: projectRef } = useParams()
  const [open, setOpen] = useState(false)

  const state = useDatabaseSelectorStateSnapshot()
  const selectedDatabaseId = state.selectedDatabaseId

  const { data, isLoading, isSuccess } = useReadReplicasQuery({ projectRef })
  const databases = data ?? []
  const sortedDatabases = databases
    .sort((a, b) => (a.inserted_at > b.inserted_at ? 1 : 0))
    .sort((database) => (database.identifier === projectRef ? -1 : 0))

  const selectedDatabase = databases.find((db) => db.identifier === selectedDatabaseId)
  const selectedDatabaseRegion = formatDatabaseRegion(selectedDatabase?.region ?? '')
  const formattedDatabaseId = formatDatabaseID(selectedDatabaseId ?? '')

  const selectedAdditionalOption = additionalOptions.find((x) => x.id === selectedDatabaseId)

  return (
    <Popover_Shadcn_ open={open} onOpenChange={setOpen} modal={false}>
      <PopoverTrigger_Shadcn_ asChild>
        <div className="flex items-center space-x-2 cursor-pointer">
          <Button
            type="default"
            className={cn(
              'pr-2',
              variant === 'connected-on-right' && 'rounded-r-none',
              variant === 'connected-on-left' && 'rounded-l-none border-l-0',
              variant === 'connected-on-both' && 'rounded-none border-x-0'
            )}
            icon={isLoading && <IconLoader className="animate-spin" />}
            iconRight={
              <IconChevronDown className="text-foreground-light" strokeWidth={2} size={12} />
            }
          >
            Source:{' '}
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
      <PopoverContent_Shadcn_ className="p-0 w-64" side="bottom" align="end">
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
                    }}
                    onClick={() => {
                      state.setSelectedDatabaseId(option.id)
                      setOpen(false)
                    }}
                  >
                    <div className="w-full flex items-center justify-between">
                      <p>{option.name}</p>
                      {option.id === selectedDatabaseId && <IconCheck />}
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
                        {database.identifier === selectedDatabaseId && <IconCheck />}
                      </div>
                    </CommandItem_Shadcn_>
                  )
                })}
              </ScrollArea>
            </CommandGroup_Shadcn_>
            <CommandGroup_Shadcn_ className="border-t">
              <CommandItem_Shadcn_
                className="cursor-pointer w-full"
                onSelect={() => {
                  setOpen(false)
                  router.push(`/project/${projectRef}/settings/infrastructure`)
                }}
                onClick={() => setOpen(false)}
              >
                <Link
                  href={`/project/${projectRef}/settings/infrastructure`}
                  onClick={() => setOpen(false)}
                  className="w-full flex items-center gap-2"
                >
                  <IconPlus size={14} strokeWidth={1.5} />
                  <p>Create a new read replica</p>
                </Link>
              </CommandItem_Shadcn_>
            </CommandGroup_Shadcn_>
          </CommandList_Shadcn_>
        </Command_Shadcn_>
      </PopoverContent_Shadcn_>
    </Popover_Shadcn_>
  )
}

export default DatabaseSelector
