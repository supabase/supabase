import { useParams } from 'common'
import { useState } from 'react'
import {
  Button,
  CommandGroup_Shadcn_,
  CommandItem_Shadcn_,
  CommandList_Shadcn_,
  Command_Shadcn_,
  IconCheck,
  IconChevronDown,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
  Popover_Shadcn_,
  ScrollArea,
} from 'ui'

import { useReadReplicasQuery } from 'data/read-replicas/replicas-query'
import { formatDatabaseID, formatDatabaseRegion } from 'data/read-replicas/replicas.utils'

interface DatabaseSelectorProps {
  selectedDatabaseId?: string
  onChangeDatabaseId: (id: string) => void
}

const DatabaseSelector = ({ selectedDatabaseId, onChangeDatabaseId }: DatabaseSelectorProps) => {
  const { ref: projectRef } = useParams()
  const [open, setOpen] = useState(false)
  const { data } = useReadReplicasQuery({ projectRef })
  const databases = data ?? []
  const selectedDatabase = databases.find((db) => db.identifier === selectedDatabaseId)
  const selectedDatabaseRegion = formatDatabaseRegion(selectedDatabase?.region ?? '')
  const formattedDatabaseId = formatDatabaseID(selectedDatabaseId ?? '')

  return (
    <Popover_Shadcn_ open={open} onOpenChange={setOpen} modal={false}>
      <PopoverTrigger_Shadcn_ asChild>
        <div className="flex items-center space-x-2 cursor-pointer">
          <Button
            type="default"
            className="pr-2"
            iconRight={
              <IconChevronDown className="text-foreground-light" strokeWidth={2} size={12} />
            }
          >
            Source:{' '}
            <span className="capitalize">
              {selectedDatabase?.identifier === projectRef ? 'Primary database' : 'Read replica'}
            </span>{' '}
            {selectedDatabase?.identifier !== projectRef && (
              <span>
                ({selectedDatabaseRegion} - {formattedDatabaseId})
              </span>
            )}
          </Button>
        </div>
      </PopoverTrigger_Shadcn_>
      <PopoverContent_Shadcn_ className="p-0 w-64" side="bottom" align="end">
        <Command_Shadcn_>
          <CommandList_Shadcn_>
            <CommandGroup_Shadcn_>
              <ScrollArea className={(databases || []).length > 7 ? 'h-[210px]' : ''}>
                {databases?.map((database) => {
                  const region = formatDatabaseRegion(database.region)
                  const id = formatDatabaseID(database.identifier)

                  return (
                    <CommandItem_Shadcn_
                      key={database.identifier}
                      value={database.identifier}
                      className="cursor-pointer w-full"
                      onSelect={() => {
                        onChangeDatabaseId(database.identifier)
                        setOpen(false)
                      }}
                      onClick={() => {
                        onChangeDatabaseId(database.identifier)
                        setOpen(false)
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
          </CommandList_Shadcn_>
        </Command_Shadcn_>
      </PopoverContent_Shadcn_>
    </Popover_Shadcn_>
  )
}

export default DatabaseSelector
