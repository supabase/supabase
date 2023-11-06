import { useState } from 'react'
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
  IconCheck,
  IconCode,
  IconLoader,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
  Popover_Shadcn_,
  ScrollArea,
} from 'ui'

import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { useEntityTypesQuery } from 'data/entity-types/entity-types-infinite-query'

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
  const { project } = useProjectContext()

  const { data, isLoading, isSuccess, isError, error, refetch } = useEntityTypesQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
    schema: selectedSchemaName,
  })

  const entities = (data?.pages[0].data.entities ? [...data?.pages[0].data.entities] : []).sort(
    (a, b) => (a.name > b.name ? 0 : -1)
  )

  return (
    <div className={className}>
      {isLoading && (
        <Button
          type="outline"
          className="w-full [&>span]:w-full text-xs text-light"
          icon={<IconLoader className="animate-spin" size={12} />}
        >
          <p className="flex">Loading tables...</p>
        </Button>
      )}

      {showError && isError && (
        <Alert_Shadcn_ variant="warning" className="!px-3 !py-3">
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
        <Popover_Shadcn_ open={open} onOpenChange={setOpen} modal={false}>
          <PopoverTrigger_Shadcn_ asChild>
            <Button
              size={size}
              type="outline"
              className={`w-full [&>span]:w-full ${size === 'small' ? 'py-1.5' : ''}`}
              iconRight={
                <IconCode className="text-foreground-light rotate-90" strokeWidth={2} size={12} />
              }
            >
              <div className="w-full flex space-x-3">
                <p className="text-xs text-light">table</p>
                <p className="text-xs">
                  {selectedTableName === '*' ? 'All tables' : selectedTableName}
                </p>
              </div>
            </Button>
          </PopoverTrigger_Shadcn_>
          <PopoverContent_Shadcn_ className="p-0 w-64" side="bottom" align="start">
            <Command_Shadcn_>
              <CommandInput_Shadcn_ placeholder="Find table..." />
              <CommandList_Shadcn_>
                <CommandEmpty_Shadcn_>No tables found</CommandEmpty_Shadcn_>
                <CommandGroup_Shadcn_>
                  <ScrollArea className={(entities || []).length > 7 ? 'h-[210px]' : ''}>
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
                        <IconCheck className="text-brand" strokeWidth={2} />
                      )}
                    </CommandItem_Shadcn_>
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
                          <IconCheck className="text-brand" strokeWidth={2} />
                        )}
                      </CommandItem_Shadcn_>
                    ))}
                  </ScrollArea>
                </CommandGroup_Shadcn_>
              </CommandList_Shadcn_>
            </Command_Shadcn_>
          </PopoverContent_Shadcn_>
        </Popover_Shadcn_>
      )}
    </div>
  )
}

export default TableSelector
