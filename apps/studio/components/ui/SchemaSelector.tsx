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
  IconPlus,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
  Popover_Shadcn_,
  ScrollArea,
} from 'ui'

import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { useSchemasQuery } from 'data/database/schemas-query'

interface SchemaSelectorProps {
  className?: string
  size?: 'tiny' | 'small'
  showError?: boolean
  selectedSchemaName: string
  supportSelectAll?: boolean
  onSelectSchema: (name: string) => void
  onSelectCreateSchema?: () => void
}

const SchemaSelector = ({
  className,
  size = 'tiny',
  showError = true,
  selectedSchemaName,
  supportSelectAll = false,
  onSelectSchema,
  onSelectCreateSchema,
}: SchemaSelectorProps) => {
  const [open, setOpen] = useState(false)

  const { project } = useProjectContext()
  const {
    data,
    isLoading: isSchemasLoading,
    isSuccess: isSchemasSuccess,
    isError: isSchemasError,
    error: schemasError,
    refetch: refetchSchemas,
  } = useSchemasQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  const schemas = (data ?? []).sort((a, b) => (a.name > b.name ? 0 : -1))

  return (
    <div className={className}>
      {isSchemasLoading && (
        <Button
          type="outline"
          className="w-full [&>span]:w-full"
          icon={<IconLoader className="animate-spin" size={12} />}
        >
          <div className="w-full flex space-x-3 py-0.5">
            <p className="text-xs text-foreground-light">Loading schemas...</p>
          </div>
        </Button>
      )}

      {showError && isSchemasError && (
        <Alert_Shadcn_ variant="warning" className="!px-3 !py-3">
          <AlertTitle_Shadcn_ className="text-xs text-amber-900">
            Failed to load schemas
          </AlertTitle_Shadcn_>
          <AlertDescription_Shadcn_ className="text-xs mb-2">
            Error: {schemasError?.message}
          </AlertDescription_Shadcn_>
          <Button type="default" size="tiny" onClick={() => refetchSchemas()}>
            Reload schemas
          </Button>
        </Alert_Shadcn_>
      )}

      {isSchemasSuccess && (
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
              <div className="w-full flex space-x-3 py-0.5">
                <p className="text-xs text-foreground-light">schema</p>
                <p className="text-xs">
                  {selectedSchemaName === '*' ? 'All schemas' : selectedSchemaName}
                </p>
              </div>
            </Button>
          </PopoverTrigger_Shadcn_>
          <PopoverContent_Shadcn_ className="p-0 w-64" side="bottom" align="start">
            <Command_Shadcn_>
              <CommandInput_Shadcn_ placeholder="Find schema..." />
              <CommandList_Shadcn_>
                <CommandEmpty_Shadcn_>No schemas found</CommandEmpty_Shadcn_>
                <CommandGroup_Shadcn_>
                  <ScrollArea className={(schemas || []).length > 7 ? 'h-[210px]' : ''}>
                    {supportSelectAll && (
                      <CommandItem_Shadcn_
                        key="select-all"
                        className="cursor-pointer flex items-center justify-between space-x-2 w-full"
                        onSelect={() => {
                          onSelectSchema('*')
                          setOpen(false)
                        }}
                        onClick={() => {
                          onSelectSchema('*')
                          setOpen(false)
                        }}
                      >
                        <span>All schemas</span>
                        {selectedSchemaName === '*' && (
                          <IconCheck className="text-brand" strokeWidth={2} />
                        )}
                      </CommandItem_Shadcn_>
                    )}
                    {schemas?.map((schema) => (
                      <CommandItem_Shadcn_
                        key={schema.id}
                        className="cursor-pointer flex items-center justify-between space-x-2 w-full"
                        onSelect={() => {
                          onSelectSchema(schema.name)
                          setOpen(false)
                        }}
                        onClick={() => {
                          onSelectSchema(schema.name)
                          setOpen(false)
                        }}
                      >
                        <span>{schema.name}</span>
                        {selectedSchemaName === schema.name && (
                          <IconCheck className="text-brand" strokeWidth={2} />
                        )}
                      </CommandItem_Shadcn_>
                    ))}
                  </ScrollArea>
                </CommandGroup_Shadcn_>
                {onSelectCreateSchema !== undefined && (
                  <CommandGroup_Shadcn_ className="border-t">
                    <CommandItem_Shadcn_
                      className="cursor-pointer flex items-center gap-x-2 w-full"
                      onSelect={() => {
                        onSelectCreateSchema()
                        setOpen(false)
                      }}
                      onClick={() => {
                        onSelectCreateSchema()
                        setOpen(false)
                      }}
                    >
                      <IconPlus />
                      Create a new schema
                    </CommandItem_Shadcn_>
                  </CommandGroup_Shadcn_>
                )}
              </CommandList_Shadcn_>
            </Command_Shadcn_>
          </PopoverContent_Shadcn_>
        </Popover_Shadcn_>
      )}
    </div>
  )
}

export default SchemaSelector
