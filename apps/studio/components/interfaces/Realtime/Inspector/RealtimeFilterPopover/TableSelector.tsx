import { useEffect, useState } from 'react'
import {
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Alert_Shadcn_,
  Button,
  CommandEmpty_Shadcn_,
  CommandGroup_Shadcn_,
  CommandInput_Shadcn_,
  CommandItem_Shadcn_,
  CommandList_Shadcn_,
  Command_Shadcn_,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
  Popover_Shadcn_,
  ScrollArea,
} from 'ui'

import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { useEntityTypesQuery } from 'data/entity-types/entity-types-infinite-query'
import { debounce } from 'lodash'
import { Loader, Code, Check } from 'lucide-react'

interface TableSelectorProps {
  className?: string
  size?: 'tiny' | 'small'
  showError?: boolean
  selectedSchemaName: string
  selectedTableName: string
  onSelectTable: (name: string, id: number | undefined) => void
}

const TableSelector = ({
  className,
  size = 'tiny',
  showError = true,
  selectedSchemaName,
  selectedTableName,
  onSelectTable,
}: TableSelectorProps) => {
  const [open, setOpen] = useState(false)
  const [initiallyLoaded, setInitiallyLoaded] = useState(false)
  const { project } = useProjectContext()
  const [searchInput, setSearchInput] = useState('')

  const { data, isLoading, isSuccess, isError, error, refetch } = useEntityTypesQuery({
    projectRef: project?.ref,
    search: searchInput,
    connectionString: project?.connectionString,
    schemas: [selectedSchemaName],
  })
  useEffect(() => {
    if (!initiallyLoaded && isSuccess) {
      setInitiallyLoaded(true)
    }
  }, [initiallyLoaded, isSuccess])

  useEffect(() => {
    if (!open && searchInput !== '') {
      setSearchInput('')
    }
  }, [open, searchInput])

  const searchTables = debounce(setSearchInput)

  const entities = (data?.pages[0].data.entities ? [...data?.pages[0].data.entities] : []).sort(
    (a, b) => (a.name > b.name ? 0 : -1)
  )

  return (
    <div className={className}>
      <Popover_Shadcn_ open={open} onOpenChange={setOpen} modal={false}>
        <PopoverTrigger_Shadcn_ asChild>
          <Button
            size={size}
            type="outline"
            disabled={isLoading}
            className={`w-full [&>span]:w-full ${size === 'small' ? 'py-1.5' : ''}`}
            icon={isLoading ? <Loader className="animate-spin" size={12} /> : null}
            iconRight={
              <Code className="text-foreground-light rotate-90" strokeWidth={2} size={12} />
            }
          >
            {initiallyLoaded ? (
              <div className="w-full flex space-x-3">
                <p className="text-xs text-light">table</p>
                <p className="text-xs">
                  {selectedTableName === '*' ? 'All tables' : selectedTableName}
                </p>
              </div>
            ) : (
              <p className="flex text-xs text-light">Loading tables...</p>
            )}
          </Button>
        </PopoverTrigger_Shadcn_>
        <PopoverContent_Shadcn_ className="p-0 w-64" side="bottom" align="start">
          <Command_Shadcn_>
            <CommandInput_Shadcn_
              placeholder="Find table..."
              onValueChange={(str) => searchTables(str)}
            />
            <CommandList_Shadcn_>
              {isLoading && (
                <div className="flex items-center justify-center space-x-2 px-3 py-2">
                  <Loader className="animate-spin" size={12} />
                  <p className="flex text-xs text-light">Loading tables...</p>
                </div>
              )}

              {showError && isError && (
                <Alert_Shadcn_ variant="warning" className="!px-3 !py-3 !border-0 rounded-none">
                  <AlertTitle_Shadcn_ className="text-xs text-amber-900">
                    Failed to load tables
                  </AlertTitle_Shadcn_>
                  <AlertDescription_Shadcn_ className="text-xs mb-2">
                    Error: {(error as any)?.message}
                  </AlertDescription_Shadcn_>
                  <Button type="default" size="tiny" onClick={() => refetch()}>
                    Reload tables
                  </Button>
                </Alert_Shadcn_>
              )}

              {isSuccess && (
                <>
                  <CommandGroup_Shadcn_ forceMount>
                    <ScrollArea className={(entities || []).length > 7 ? 'h-[210px]' : ''}>
                      <CommandEmpty_Shadcn_>No tables found</CommandEmpty_Shadcn_>
                      {!searchInput && (
                        <CommandItem_Shadcn_
                          key="all-tables"
                          className="cursor-pointer flex items-center justify-between space-x-2 w-full"
                          onSelect={() => {
                            onSelectTable('*', undefined)
                            setOpen(false)
                          }}
                          onClick={() => {
                            onSelectTable('*', undefined)
                            setOpen(false)
                          }}
                        >
                          <span>All tables</span>
                          {selectedSchemaName === '*' && (
                            <Check className="text-brand" strokeWidth={2} />
                          )}
                        </CommandItem_Shadcn_>
                      )}
                      {entities?.map((table) => (
                        <CommandItem_Shadcn_
                          key={table.id}
                          className="cursor-pointer flex items-center justify-between space-x-2 w-full"
                          onSelect={() => {
                            onSelectTable(table.name, table.id)
                            setOpen(false)
                          }}
                          onClick={() => {
                            onSelectTable(table.name, table.id)
                            setOpen(false)
                          }}
                        >
                          <span>{table.name}</span>
                          {selectedSchemaName === table.name && (
                            <Check className="text-brand" strokeWidth={2} />
                          )}
                        </CommandItem_Shadcn_>
                      ))}
                    </ScrollArea>
                  </CommandGroup_Shadcn_>
                </>
              )}
            </CommandList_Shadcn_>
          </Command_Shadcn_>
        </PopoverContent_Shadcn_>
      </Popover_Shadcn_>
    </div>
  )
}

export default TableSelector
