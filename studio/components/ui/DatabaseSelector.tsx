import { MOCK_DATABASES } from 'components/interfaces/Settings/Infrastructure/InfrastructureConfiguration/InstanceConfiguration.constants'
import { useState } from 'react'
import {
  Popover_Shadcn_,
  PopoverTrigger_Shadcn_,
  Button,
  IconChevronDown,
  PopoverContent_Shadcn_,
  Command_Shadcn_,
  CommandList_Shadcn_,
  CommandGroup_Shadcn_,
  ScrollArea,
  CommandItem_Shadcn_,
  IconCheck,
} from 'ui'

interface DatabaseSelectorProps {
  selectedDatabaseId: string
  onChangeDatabaseId: (id: string) => void
}

const DatabaseSelector = ({ selectedDatabaseId, onChangeDatabaseId }: DatabaseSelectorProps) => {
  const [open, setOpen] = useState(false)
  const databases = MOCK_DATABASES.sort((a, b) => (a.id > b.id ? 1 : -1))
  const selectedDatabase = databases.find((db) => db.id.toString() === selectedDatabaseId)

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
              {(selectedDatabase?.type ?? '').split('_').join(' ').toLowerCase()}
              {selectedDatabase?.type === 'PRIMARY' && ' database'}
            </span>{' '}
            {selectedDatabase?.type === 'READ_REPLICA' && <span>(ID: {selectedDatabase?.id})</span>}
          </Button>
        </div>
      </PopoverTrigger_Shadcn_>
      <PopoverContent_Shadcn_ className="p-0 w-48" side="bottom" align="end">
        <Command_Shadcn_>
          <CommandList_Shadcn_>
            <CommandGroup_Shadcn_>
              <ScrollArea className={(databases || []).length > 7 ? 'h-[210px]' : ''}>
                {databases?.map((database) => {
                  return (
                    <CommandItem_Shadcn_
                      key={database.id}
                      value={database.id.toString()}
                      className="cursor-pointer w-full"
                      onSelect={() => {
                        onChangeDatabaseId(database.id.toString())
                        setOpen(false)
                      }}
                      onClick={() => {
                        onChangeDatabaseId(database.id.toString())
                        setOpen(false)
                      }}
                    >
                      <div className="w-full flex items-center justify-between">
                        <p>
                          {database.type === 'PRIMARY'
                            ? 'Primary database'
                            : `Read replica (ID: ${database.id})`}
                        </p>
                        {database.id.toString() === selectedDatabaseId && <IconCheck />}
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
